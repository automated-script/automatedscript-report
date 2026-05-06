package com.automatedscript.report.model;

import java.util.ArrayList;
import java.util.List;

public class Evidence {
    public List<EvidenceRef> screenshots = new ArrayList<>();
    public String video = "";

    public Evidence addScreenshot(String title, String url) {
        screenshots.add(new EvidenceRef(title, url));
        return this;
    }

    public Evidence video(String url) {
        this.video = url;
        return this;
    }
}
