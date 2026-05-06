package com.automatedscript.report.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class TimeUtil {
    private static final DateTimeFormatter HMS = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static String nowHms() {
        return LocalDateTime.now(ZoneId.systemDefault()).format(HMS);
    }

    public static String nowIso() {
        return LocalDateTime.now(ZoneId.systemDefault()).format(ISO);
    }
}
