package com.automatedscript.report;

import com.automatedscript.report.model.*;
import com.automatedscript.report.util.FileUtil;
import com.automatedscript.report.util.TemplateUtil;
import com.automatedscript.report.util.TimeUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.automatedscript.report.history.HistoryStore;
import com.automatedscript.report.history.HistoryStore.HistoryFile;
import com.automatedscript.report.history.HistoryStore.TestRun;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class AutoScriptReporter {

	private static volatile AutoScriptReporter GLOBAL;
	public static AutoScriptReporter global() { return GLOBAL; }

	private static final ThreadLocal<AutoScriptReporter> CURRENT = new ThreadLocal<>();
	public static AutoScriptReporter current(){ return CURRENT.get(); }
	static void setCurrent(AutoScriptReporter r){ CURRENT.set(r);} 
	static void clearCurrent(){ CURRENT.remove(); }

	private final ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
	private final ReportModel report = new ReportModel();
	private final Map<String, TestCase> testMap = new ConcurrentHashMap<>();
	private final Path reportDir;

	private boolean zipOnComplete = false;

	public AutoScriptReporter enableZipExport(boolean enable) {
	    this.zipOnComplete = enable;
	    return this;
	}
	private AutoScriptReporter(Path baseDir, String runName) {
		this.reportDir = baseDir.resolve(runName);
		report.meta.startTime = TimeUtil.nowIso();
	}

	public static synchronized AutoScriptReporter create(String outputDir) {
		if (GLOBAL != null) return GLOBAL;

		String runName = "Run_" + TimeUtil.nowIso().replace(":", "-");
		AutoScriptReporter r = new AutoScriptReporter(Path.of(outputDir), runName);
		setCurrent(r);
		return r;
	}

	public Path getReportDir() { return reportDir; }

	public AutoScriptReporter metaProject(String project) { report.meta.project = project; return this; }
	public AutoScriptReporter metaSuite(String suite) { report.meta.suiteName = suite; return this; }
	public AutoScriptReporter metaBuild(String build) { report.meta.build = build; return this; }
	public AutoScriptReporter executedBy(String by) { report.meta.executedBy = by; return this; }
	public AutoScriptReporter env(String key, Object value) { report.meta.environment.put(key, value); return this; }

	public TestCase createTest(String id, String name) {

		TestCaseModel t = new TestCaseModel();
		t.id = (id == null || id.isBlank())
				? "TC-" + UUID.randomUUID().toString().substring(0, 8)
						: id;
		t.name = name == null ? "Unnamed Test" : name;
		t.status = Status.PASS;

		report.tests.add(t);

		TestCase tc = new TestCase(t);
		testMap.put(t.id, tc);
		TestCase.setCurrent(tc);

		// 🧠 HYBRID TIMING SUPPORT
		// If listener does NOT control timing, reporter will
		if (!t.listenerTiming) {
			tc.startTime(com.automatedscript.report.util.TimeUtil.nowHms());
			tc._startMs(System.currentTimeMillis());
		}

		return tc;
	}


	/** Extent-style final method: generates self-contained HTML (no server). */
	public synchronized void generateReport() {
		// 🧠 FINALIZE timing for MANUAL mode tests
	    /*for (TestCase tc : testMap.values()) {
	        tc.finalizeManualTiming();
	    }*/
		report.meta.endTime = TimeUtil.nowIso();
		computeSummary();
		try {
			String templateHtml = TemplateUtil.readResourceAsString("/template/automatedScript-report.html");
			StringBuilder uiBundle = new StringBuilder();

			uiBundle.append(TemplateUtil.readResourceAsString("/template/js/utils.js")).append("\n;\n");
			uiBundle.append(TemplateUtil.readResourceAsString("/template/js/events.js")).append("\n;\n");
			uiBundle.append(TemplateUtil.readResourceAsString("/template/js/charts.js")).append("\n;\n");
			uiBundle.append(TemplateUtil.readResourceAsString("/template/js/testList.js")).append("\n;\n");
			uiBundle.append(TemplateUtil.readResourceAsString("/template/js/app.js")).append("\n;\n");
			uiBundle.append(TemplateUtil.readResourceAsString("/template/report-ui.js")).append("\n;\n");

			String safeJs = uiBundle.toString().replace("</script>", "<\\/script>");
			String embeddedUi = "<script>\n" + safeJs + "\n</script>";

			String json = mapper.writeValueAsString(report);

			// ===== History feature =====
			Path historyFile = reportDir.getParent().resolve("history").resolve("history.json");
			HistoryFile hf = HistoryStore.load(historyFile);

			String runId = reportDir.getFileName().toString();
			String runStart = report.meta.startTime;
			String suite = report.meta.suiteName;

			for (TestCaseModel t : report.tests) {
				TestRun tr = new TestRun();
				tr.runId = runId;
				tr.runStart = runStart;
				tr.suite = suite;
				tr.reportPath = reportDir.getFileName().toString() + "/automatedScript-report.html";
				tr.testId = t.id;
				tr.testName = t.name;
				tr.status = t.status.name();
				tr.durationMs = t.durationMs;
				tr.defectId = t.defectId;

				String firstFail = "";
				for (StepLog st : t.steps) {
					if (st.status == Status.FAIL) { firstFail = st.action; break; }
				}
				tr.firstFailure = firstFail;
				hf.items.add(tr);
			}

			HistoryStore.trimToLastRuns(hf, 25);
			HistoryStore.save(historyFile, hf);

			String historyJson = mapper.writeValueAsString(HistoryStore.lastNRunsPerTest(hf, 3));
			String embeddedHistory = "<script>\nwindow.__AUTOMATEDSCRIPT_HISTORY__ = " + historyJson + ";\n</script>";

			String embeddedJson = "<script>\nwindow.__AUTOMATEDSCRIPT_REPORT__ = " + json + ";\n</script>";

			String finalHtml = templateHtml
					.replace("<!--__REPORT_DATA__-->", embeddedJson + "\n" + embeddedHistory)
					.replace("<!--__REPORT_UI_JS__-->", embeddedUi);

			FileUtil.atomicWrite(reportDir.resolve("automatedScript-report.html"), finalHtml.getBytes(StandardCharsets.UTF_8));
			// ================= COPY FAVICON =================
			try (InputStream in = TemplateUtil.class.getResourceAsStream("/template/favicon.png")) {
			    if (in != null) {
			        Files.copy(in, reportDir.resolve("favicon.png"), StandardCopyOption.REPLACE_EXISTING);
			    }
			} catch (Exception e) {
			    System.err.println("Favicon copy failed: " + e.getMessage());
			}
			// ===============================================
			// ================= OPTIONAL ZIP EXPORT =================
			if (zipOnComplete) {
			    try {
			        Path zipPath = reportDir.resolveSibling(reportDir.getFileName() + ".zip");
			        zipReportBundle(reportDir, zipPath);
			        System.out.println("📦 Shareable report ZIP created: " + zipPath);
			    } catch (Exception e) {
			        System.err.println("ZIP export failed: " + e.getMessage());
			    }
			}
			// =======================================================

			// optional
		} catch (IOException e) {
			throw new RuntimeException("Failed to generate offline report", e);
		}
	}
	private void zipReportBundle(Path reportDir, Path zipPath) throws IOException {
	    try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipPath))) {

	        // Add report folder files
	        Files.walk(reportDir).filter(Files::isRegularFile).forEach(path -> {
	            try {
	                String entryName = reportDir.getFileName() + "/" + reportDir.relativize(path).toString().replace("\\","/");
	                zos.putNextEntry(new ZipEntry(entryName));
	                Files.copy(path, zos);
	                zos.closeEntry();
	            } catch (IOException e) {
	                throw new UncheckedIOException(e);
	            }
	        });

	        // Add history folder
	        Path historyDir = reportDir.getParent().resolve("history");
	        if (Files.exists(historyDir)) {
	            Files.walk(historyDir).filter(Files::isRegularFile).forEach(path -> {
	                try {
	                    String entryName = "history/" + historyDir.relativize(path).toString().replace("\\","/");
	                    zos.putNextEntry(new ZipEntry(entryName));
	                    Files.copy(path, zos);
	                    zos.closeEntry();
	                } catch (IOException e) {
	                    throw new UncheckedIOException(e);
	                }
	            });
	        }
	    }
	}

	public void flush() { generateReport(); }

	/*
	 * private void computeSummary() { ReportSummary s = new ReportSummary();
	 * s.totalTests = report.tests.size(); for (TestCaseModel t : report.tests) {
	 * switch (t.status) { case PASS: s.passed++; break; case FAIL: s.failed++;
	 * break; case SKIP: s.skipped++; break; case WARNING: s.warning++; break;
	 * default: break; } s.totalSteps += t.steps.size(); for (StepLog st : t.steps)
	 * { if (st.status == Status.PASS) s.stepsPassed++; else if (st.status ==
	 * Status.FAIL) s.stepsFailed++; } } long totalMs =
	 * report.tests.stream().filter(t -> t.durationMs != null).mapToLong(t ->
	 * t.durationMs).sum(); long count = report.tests.stream().filter(t ->
	 * t.durationMs != null).count(); s.avgDurationHuman = (count>0) ?
	 * msToHuman(totalMs/count) : "-"; report.summary = s; }
	 */
	private void computeSummary() {
	    ReportSummary s = new ReportSummary();
	    s.totalTests = report.tests.size();

	    for (TestCaseModel t : report.tests) {
	        switch (t.status) {
	            case PASS: s.passed++; break;
	            case FAIL: s.failed++; break;
	            case SKIP: s.skipped++; break;
	            case WARNING: s.warning++; break;
	            default: break;
	        }

	        s.totalSteps += t.steps.size();
	        for (StepLog st : t.steps) {
	            if (st.status == Status.PASS) s.stepsPassed++;
	            else if (st.status == Status.FAIL) s.stepsFailed++;
	        }
	    }

	    // 🔥 DERIVED VALUES
	    s.testsOther = Math.max(0, s.totalTests - s.passed);
	    s.stepsOther = Math.max(0, s.totalSteps - s.stepsPassed);

	    //s.testsPassPct = s.totalTests > 0 ? (s.passed * 100) / s.totalTests : 0;
	    if (s.totalTests > 0) {
	        double rawPass = (s.passed * 100.0) / s.totalTests;
	        s.testsPassPct = (int) Math.round(rawPass);
	    } else {
	        s.testsPassPct = 0;
	    }

	    //s.stepsPassPct = s.totalSteps > 0 ? (s.stepsPassed * 100) / s.totalSteps : 0;
	    if (s.totalSteps > 0) {
	        double rawPass = (s.stepsPassed * 100.0) / s.totalSteps;
	        s.stepsPassPct = (int) Math.round(rawPass);
	    } else {
	        s.stepsPassPct = 0;
	    }
	    long totalMs = report.tests.stream()
	        .filter(t -> t.durationMs != null)
	        .mapToLong(t -> t.durationMs)
	        .sum();

	    long count = report.tests.stream()
	        .filter(t -> t.durationMs != null)
	        .count();

	    s.avgDurationHuman = (count > 0) ? msToHuman(totalMs / count) : "-";

	    report.summary = s;
	}


	private String msToHuman(long ms){
		long sec = Math.round(ms / 1000.0);
		if (sec < 60) return sec + "s";
		long m = sec / 60;
		long r = sec % 60;
		return m + "m " + r + "s";
	}
}
