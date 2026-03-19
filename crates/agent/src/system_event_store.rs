use std::sync::{Arc, Mutex};

use blockcell_core::system_event::{EventScope, SystemEvent};
use chrono::Utc;

pub trait SystemEventStoreOps: Send + Sync {
    fn emit(&self, event: SystemEvent);
    fn list_pending(&self, limit: usize) -> Vec<SystemEvent>;
    fn list_recent(&self, scope: &EventScope, limit: usize) -> Vec<SystemEvent>;
    fn mark_delivered(&self, event_ids: &[String]);
    fn mark_acked(&self, event_ids: &[String]);
    fn count_pending(&self) -> usize;
    fn cleanup_expired(&self, max_age_secs: u64) -> usize;
}

#[derive(Clone, Default)]
pub struct InMemorySystemEventStore {
    events: Arc<Mutex<Vec<SystemEvent>>>,
}

impl InMemorySystemEventStore {
    pub fn dedup_or_merge(&self, event: SystemEvent) {
        let mut events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        if let Some(dedup_key) = event.dedup_key.as_deref() {
            if let Some(existing) = events.iter_mut().find(|existing| {
                !existing.delivered
                    && !existing.acked
                    && existing.dedup_key.as_deref() == Some(dedup_key)
            }) {
                *existing = event;
                return;
            }
        }
        events.push(event);
    }
}

impl SystemEventStoreOps for InMemorySystemEventStore {
    fn emit(&self, event: SystemEvent) {
        self.dedup_or_merge(event);
    }

    fn list_pending(&self, limit: usize) -> Vec<SystemEvent> {
        let events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        let mut pending: Vec<SystemEvent> = events
            .iter()
            .filter(|event| !event.delivered)
            .cloned()
            .collect();
        pending.sort_by_key(|event| event.created_at_ms);
        pending.truncate(limit);
        pending
    }

    fn list_recent(&self, scope: &EventScope, limit: usize) -> Vec<SystemEvent> {
        let events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        let mut recent: Vec<SystemEvent> = events
            .iter()
            .filter(|event| &event.scope == scope)
            .cloned()
            .collect();
        recent.sort_by(|left, right| right.created_at_ms.cmp(&left.created_at_ms));
        recent.truncate(limit);
        recent
    }

    fn mark_delivered(&self, event_ids: &[String]) {
        let mut events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        for event in events.iter_mut() {
            if event_ids.iter().any(|event_id| event_id == &event.id) {
                event.delivered = true;
            }
        }
    }

    fn mark_acked(&self, event_ids: &[String]) {
        let mut events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        for event in events.iter_mut() {
            if event_ids.iter().any(|event_id| event_id == &event.id) {
                event.acked = true;
            }
        }
    }

    fn count_pending(&self) -> usize {
        let events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        events.iter().filter(|event| !event.delivered).count()
    }

    fn cleanup_expired(&self, max_age_secs: u64) -> usize {
        let cutoff = Utc::now().timestamp_millis() - (max_age_secs as i64 * 1000);
        let mut events = self
            .events
            .lock()
            .expect("system event store lock poisoned");
        let before = events.len();
        events.retain(|event| event.created_at_ms >= cutoff);
        before.saturating_sub(events.len())
    }
}
