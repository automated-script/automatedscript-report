package com.automatedscript.report.integrations;

import com.automatedscript.report.AutoScriptReporter;
import com.automatedscript.report.TestCase;
import com.automatedscript.report.model.Evidence;
import com.automatedscript.report.model.Status;
import com.automatedscript.report.util.TimeUtil;
import org.testng.*;

public class AutoScriptTestNGListener implements ITestListener, ISuiteListener {

    private static final ThreadLocal<Long> TEST_START_MS = new ThreadLocal<>();
    private static AutoScriptReporter REPORTER;

    public static void setReporter(AutoScriptReporter reporter) {
        REPORTER = reporter;
    }

    @Override
    public void onStart(ISuite suite) {
        if (REPORTER == null) {
            REPORTER = AutoScriptReporter.create("AutomationReports")
                    .metaProject(suite.getName())
                    .metaSuite(suite.getName())
                    .metaBuild("local")
                    .executedBy("TestNG");
        }
    }

    @Override
    public void onTestStart(ITestResult result) {
        try {
            if (REPORTER == null) return;

            String testName = result.getMethod().getMethodName();
            String testId = "TC-" + testName.toUpperCase();

            TestCase tc = REPORTER.createTest(testId, testName);
            TestCase.setCurrent(tc);

            long start = System.currentTimeMillis();
            TEST_START_MS.set(start);

            if (tc != null) {
                tc.startTime(TimeUtil.nowHms());   // existing
                tc.markListenerTiming();          // 🆕 tell system listener controls timing
            }

        } catch (Exception ignored) {}
    }


    // 🔥 Single timing calculation point
    private void finalizeDuration() {
        try {
            TestCase tc = TestCase.current();
            Long start = TEST_START_MS.get();

            if (tc != null && start != null) {
                long end = System.currentTimeMillis();
                long dur = Math.max(0L, end - start);

                tc.durationMs(dur);               // existing graph usage
                tc.endTime(TimeUtil.nowHms());    // store readable end time
            }
        } catch (Exception ignored) {
        } finally {
            TEST_START_MS.remove();
        }
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        finalizeDuration();

        TestCase tc = TestCase.current();
        if (tc != null) tc.log(Status.PASS, "Test passed", "", null);

        TestCase.clearCurrent();
    }

    @Override
    public void onTestFailure(ITestResult result) {
        finalizeDuration();

        TestCase tc = TestCase.current();
        if (tc != null) {
            String msg = result.getThrowable() != null
                    ? StackTraceUtil.toCompact(result.getThrowable(), 40)
                    : "Unknown failure";

            Evidence shot = ScreenshotUtil.capture(
                    DriverManager.getDriver(),
                    REPORTER.getReportDir(),
                    "Failure Screenshot"
            );

            tc.log(Status.FAIL, "Test failed", msg, shot);
        }

        TestCase.clearCurrent();
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        finalizeDuration();

        TestCase tc = TestCase.current();
        if (tc != null) tc.log(Status.SKIP, "Test skipped", "", null);

        TestCase.clearCurrent();
    }

    @Override
    public void onFinish(ISuite suite) {
        if (REPORTER != null) REPORTER.generateReport();
    }

    public void onStart(ITestContext context) {}
    public void onFinish(ITestContext context) {}
    public void onTestFailedButWithinSuccessPercentage(ITestResult result) {}
    public void onTestFailedWithTimeout(ITestResult result) { onTestFailure(result); }
}
