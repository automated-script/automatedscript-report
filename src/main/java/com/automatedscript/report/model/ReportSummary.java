package com.automatedscript.report.model;

/*
 * public class ReportSummary { public int totalTests = 0; public int passed =
 * 0; public int failed = 0; public int skipped = 0; public int warning = 0;
 * public int fatal = 0;
 * 
 * public int totalSteps = 0; public int stepsPassed = 0; public int stepsFailed
 * = 0; public int stepsFatal = 0;
 * 
 * public String avgDurationHuman = "-"; }
 */
public class ReportSummary {
    public int totalTests = 0;
    public int passed = 0;
    public int failed = 0;
    public int skipped = 0;
    public int warning = 0;
    public int fatal = 0;

    public int totalSteps = 0;
    public int stepsPassed = 0;
    public int stepsFailed = 0;
    public int stepsFatal = 0;

    // 🔥 NEW DERIVED VALUES
    public int testsOther = 0;      // total - passed
    public int stepsOther = 0;      // total - passed

    public int testsPassPct = 0;
    public int stepsPassPct = 0;

    public String avgDurationHuman = "-";
}
