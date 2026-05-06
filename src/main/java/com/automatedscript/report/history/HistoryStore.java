package com.automatedscript.report.history;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class HistoryStore {

    public static class TestRun {
        public String runId;
        public String runStart;
        public String suite;
        public String reportPath;
        public String testId;
        public String testName;
        public String status;
        public Long durationMs;
        public String defectId;
        public String firstFailure;
    }

    public static class HistoryFile {
        public int schemaVersion = 1;
        public List<TestRun> items = new ArrayList<>();
    }

    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    public static HistoryFile load(Path historyFile) {
        try {
            if (!Files.exists(historyFile)) return new HistoryFile();
            byte[] bytes = Files.readAllBytes(historyFile);
            if (bytes.length == 0) return new HistoryFile();
            return MAPPER.readValue(bytes, HistoryFile.class);
        } catch (Exception e) {
            return new HistoryFile();
        }
    }

    public static void save(Path historyFile, HistoryFile data) throws IOException {
        Files.createDirectories(historyFile.getParent());
        byte[] bytes = MAPPER.writeValueAsString(data).getBytes(StandardCharsets.UTF_8);
        Path tmp = historyFile.resolveSibling(historyFile.getFileName().toString() + ".tmp");
        Files.write(tmp, bytes);
        Files.move(tmp, historyFile, java.nio.file.StandardCopyOption.REPLACE_EXISTING, java.nio.file.StandardCopyOption.ATOMIC_MOVE);
    }

    public static void trimToLastRuns(HistoryFile file, int maxRuns) {
        Map<String, String> runStartById = new HashMap<>();
        for (TestRun tr : file.items) runStartById.put(tr.runId, tr.runStart == null ? tr.runId : tr.runStart);

        List<String> runs = new ArrayList<>(runStartById.keySet());
        runs.sort((a,b)-> runStartById.get(b).compareTo(runStartById.get(a)));
        Set<String> keep = new HashSet<>(runs.subList(0, Math.min(maxRuns, runs.size())));
        file.items.removeIf(tr -> !keep.contains(tr.runId));
    }

    public static Map<String, List<TestRun>> lastNRunsPerTest(HistoryFile file, int n) {
        Map<String, List<TestRun>> map = new HashMap<>();
        for (TestRun tr : file.items) {
            if (tr.testId == null) continue;
            map.computeIfAbsent(tr.testId, k-> new ArrayList<>()).add(tr);
        }
        for (List<TestRun> list : map.values()) {
            list.sort((a,b)-> (b.runStart==null?b.runId:b.runStart).compareTo(a.runStart==null?a.runId:a.runStart));
            if (list.size() > n) list.subList(n, list.size()).clear();
        }
        return map;
    }
}
