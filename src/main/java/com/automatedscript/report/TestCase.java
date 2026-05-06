package com.automatedscript.report;

import com.automatedscript.report.model.Evidence;
import com.automatedscript.report.model.Status;
import com.automatedscript.report.model.StepLog;
import com.automatedscript.report.model.TestCaseModel;
import com.automatedscript.report.util.TimeUtil;

import java.util.Objects;

public class TestCase {
	private static final ThreadLocal<TestCase> CURRENT = new ThreadLocal<>();

	private final TestCaseModel model;

	TestCase(TestCaseModel model) {
		this.model = model;
	}

	/** Thread-local current test (parallel safe) */
	public static TestCase current() { return CURRENT.get(); }
	public static void setCurrent(TestCase tc) { CURRENT.set(tc); }
	public static void clearCurrent() { CURRENT.remove(); }

	/** Fluent step creation */
	public Step createStep(String stepName) { return new Step(this, stepName); }

	public TestCase category(String category) {
		model.category = category;
		return this;
	}

	public TestCase owner(String owner) {
		model.owner = owner;
		return this;
	}

	public TestCase defect(String defectId) {
		model.defectId = defectId;
		return this;
	}

	public TestCase status(Status status) {
		model.status = status;
		return this;
	}

	public TestCase durationMs(long ms) {
		model.durationMs = ms;
		return this;
	}
	// ✅ Add readable start time
	public TestCase startTime(String time) {
		this.model.startTime = time;
		return this;
	}

	// ✅ Add readable end time
	public TestCase endTime(String time) {
		this.model.endTime = time;
		return this;
	}
	public TestCase markListenerTiming() {
		this.model.listenerTiming = true;
		return this;
	}
	private Long manualStartMs;

	public TestCase _startMs(Long ms) {
		this.manualStartMs = ms;
		return this;
	}

	/*public void finalizeManualTiming() {
		if (!model.listenerTiming && manualStartMs != null) {
			long dur = System.currentTimeMillis() - manualStartMs;
			model.durationMs = dur;
			model.endTime = com.automatedscript.report.util.TimeUtil.nowHms();;
		}
	}*/
	// ✅ Explicitly mark test end (Manual mode only)
	public TestCase end() {
	    if (!model.listenerTiming && manualStartMs != null) {
	        long now = System.currentTimeMillis();
	        model.durationMs = now - manualStartMs;
	        model.endTime = TimeUtil.nowHms();
	    }
	    return this;
	}


	public TestCase pass(String step) { return log(Status.PASS, step, "", null); }
	public TestCase pass(String step, Evidence ev) { return log(Status.PASS, step, "", ev); }

	public TestCase fail(String step, String details) { return log(Status.FAIL, step, details, null); }
	public TestCase fail(String step, String details, Evidence ev) { return log(Status.FAIL, step, details, ev); }

	public TestCase warn(String step, String details) { return log(Status.WARNING, step, details, null); }
	public TestCase skip(String step, String details) { return log(Status.SKIP, step, details, null); }

	public synchronized TestCase log(Status status, String step, String details, Evidence evidence) {
	    Objects.requireNonNull(step, "step");

	    model.steps.add(new StepLog(TimeUtil.nowHms(), status, step, details == null ? "" : details, evidence));

	    // 🔥 MANUAL MODE TIMING UPDATE (listener mode untouched)
	    if (!model.listenerTiming && manualStartMs != null) {
	        long now = System.currentTimeMillis();
	        model.durationMs = now - manualStartMs;
	        model.endTime = TimeUtil.nowHms();
	    }

	    // existing status logic
	    if (status == Status.FAIL) model.status = Status.FAIL;
	    else if (model.status == Status.INFO) model.status = status;

	    return this;
	}


	TestCaseModel raw() { return model; }
}
