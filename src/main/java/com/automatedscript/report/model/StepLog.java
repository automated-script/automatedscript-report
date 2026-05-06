package com.automatedscript.report.model;

public class StepLog {
    public String time = "";
    public Status status = Status.INFO;
    public String action = "";
    public String details = "";
    public Evidence evidence = null;

    public StepLog() {}

    public StepLog(String time, Status status, String action, String details, Evidence evidence) {
        this.time = time;
        this.status = status;
        this.action = action;
        this.details = details;
        this.evidence = evidence;
    }
}
