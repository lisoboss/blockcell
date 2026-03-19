use std::time::Instant;
use tracing::info;

/// Tracks timing for various stages of message processing.
#[derive(Debug)]
pub(crate) struct ProcessingMetrics {
    start: Instant,
    decision_duration_ms: Option<u64>,
    llm_calls: Vec<u64>,
    tool_executions: Vec<(String, u64)>,
    compression_count: u32,
    finalized: bool,
}

impl ProcessingMetrics {
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
            decision_duration_ms: None,
            llm_calls: Vec::new(),
            tool_executions: Vec::new(),
            compression_count: 0,
            finalized: false,
        }
    }

    /// Record first-stage interaction decision duration.
    pub fn record_decision(&mut self, duration_ms: u64) {
        self.decision_duration_ms = Some(duration_ms);
    }

    /// Record an LLM call duration.
    pub fn record_llm_call(&mut self, duration_ms: u64) {
        self.llm_calls.push(duration_ms);
    }

    /// Record a tool execution duration.
    pub fn record_tool_execution(&mut self, tool_name: &str, duration_ms: u64) {
        self.tool_executions
            .push((tool_name.to_string(), duration_ms));
    }

    /// Record a mid-loop compression event.
    pub fn record_compression(&mut self) {
        self.compression_count += 1;
    }

    /// Total elapsed time since processing started.
    pub fn total_elapsed_ms(&self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }

    /// Log a summary of all collected metrics.
    pub fn log_summary(&mut self) {
        if self.finalized {
            return;
        }
        self.finalized = true;

        let total_ms = self.total_elapsed_ms();
        let decision_ms = self.decision_duration_ms.unwrap_or(0);
        let llm_total_ms: u64 = self.llm_calls.iter().sum();
        let tool_total_ms: u64 = self.tool_executions.iter().map(|(_, d)| d).sum();

        info!(
            total_ms,
            decision_ms,
            llm_calls = self.llm_calls.len(),
            llm_total_ms,
            tool_calls = self.tool_executions.len(),
            tool_total_ms,
            compressions = self.compression_count,
            "📊 Message processing metrics"
        );

        // Log slow tool executions (> 5 seconds)
        for (name, ms) in &self.tool_executions {
            if *ms > 5000 {
                info!(tool = %name, duration_ms = ms, "🐢 Slow tool execution");
            }
        }
    }
}

impl Drop for ProcessingMetrics {
    fn drop(&mut self) {
        self.log_summary();
    }
}

/// A simple RAII timer that records duration on drop.
pub(crate) struct ScopedTimer {
    start: Instant,
}

impl ScopedTimer {
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    /// Elapsed time in milliseconds.
    pub fn elapsed_ms(&self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_processing_metrics_basic() {
        let mut metrics = ProcessingMetrics::new();
        metrics.record_decision(100);
        metrics.record_llm_call(200);
        metrics.record_llm_call(150);
        metrics.record_tool_execution("web_search", 500);
        metrics.record_tool_execution("read_file", 10);
        metrics.record_compression();

        assert_eq!(metrics.decision_duration_ms, Some(100));
        assert_eq!(metrics.llm_calls.len(), 2);
        assert_eq!(metrics.tool_executions.len(), 2);
        assert_eq!(metrics.compression_count, 1);
        assert!(!metrics.finalized);
        assert!(metrics.total_elapsed_ms() < 1000);
    }

    #[test]
    fn test_scoped_timer() {
        let timer = ScopedTimer::new();
        std::thread::sleep(std::time::Duration::from_millis(10));
        assert!(timer.elapsed_ms() >= 5);
    }
}
