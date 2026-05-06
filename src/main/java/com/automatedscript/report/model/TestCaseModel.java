package com.automatedscript.report.model;

import java.util.ArrayList;
import java.util.List;

public class TestCaseModel {

    public String id = "";
    public String name = "";
    public Status status = Status.INFO;
    public String category = "General";
    public String owner = "Automation";
    public Long durationMs = null;
    public String defectId = "";
    public boolean listenerTiming = false;

    public List<StepLog> steps = new ArrayList<>();

    // ✅ ADD ONLY THESE TWO (DO NOT TOUCH ANYTHING ELSE)
    public String startTime = "";
    public String endTime = "";
}
