package com.automatedscript.report.model;

import java.util.ArrayList;
import java.util.List;

public class ReportModel {
    public ReportMeta meta = new ReportMeta();
    public ReportSummary summary = new ReportSummary();
    public List<TestCaseModel> tests = new ArrayList<>();
}
