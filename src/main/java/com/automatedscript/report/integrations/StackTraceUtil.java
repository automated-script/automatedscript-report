package com.automatedscript.report.integrations;

import java.io.PrintWriter;
import java.io.StringWriter;

public class StackTraceUtil {
    public static String toString(Throwable t) {
        if (t == null) return "";
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    public static String toCompact(Throwable t, int maxLines) {
        String full = toString(t);
        if (full.isBlank()) return full;
        String[] lines = full.split("\r?\n");
        StringBuilder sb = new StringBuilder();
        for (int i=0;i<Math.min(lines.length, maxLines);i++){
            sb.append(lines[i]).append("\n");
        }
        if (lines.length > maxLines) sb.append("... (").append(lines.length-maxLines).append(" more lines)");
        return sb.toString();
    }
}
