package com.automatedscript.report.model;

public enum Status {
    PASS, FAIL, SKIP, WARNING, INFO;

    public static Status from(String raw) {
        if (raw == null) return INFO;
        String s = raw.trim().toUpperCase();
        switch (s) {
            case "PASSED":
            case "PASS":
            case "SUCCESS":
                return PASS;
            case "FAILED":
            case "FAIL":
            case "ERROR":
                return FAIL;
            case "SKIPPED":
            case "SKIP":
                return SKIP;
            case "WARN":
            case "WARNING":
                return WARNING;
            default:
                return INFO;
        }
    }
}
