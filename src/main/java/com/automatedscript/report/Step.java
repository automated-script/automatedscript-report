package com.automatedscript.report;

import com.automatedscript.report.model.Evidence;
import com.automatedscript.report.model.Status;

public class Step {
    private final TestCase testCase;
    private final String name;
    private String details = "";
    private Evidence evidence = null;

    Step(TestCase testCase, String name) {
        this.testCase = testCase;
        this.name = name;
    }

    public Step details(String details) {
        this.details = details == null ? "" : details;
        return this;
    }

    public Step evidence(Evidence evidence) {
        this.evidence = evidence;
        return this;
    }

    public TestCase pass() { return testCase.log(Status.PASS, name, details, evidence); }
    public TestCase fail() { return testCase.log(Status.FAIL, name, details, evidence); }
    public TestCase skip() { return testCase.log(Status.SKIP, name, details, evidence); }
    public TestCase warn() { return testCase.log(Status.WARNING, name, details, evidence); }
    public TestCase info() { return testCase.log(Status.INFO, name, details, evidence); }
}
