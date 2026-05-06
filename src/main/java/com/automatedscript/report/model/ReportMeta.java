package com.automatedscript.report.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class ReportMeta {
    public String project = "Automation Project";
    public String suiteName = "Test Suite";
    public String build = "local";
    public String executedBy = "Local";
    public String startTime = "";
    public String endTime = "";
    public Map<String, Object> environment = new LinkedHashMap<>();
}
