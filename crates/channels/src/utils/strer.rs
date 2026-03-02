#[allow(dead_code)]

/// Extension trait that provides **UTF-8 safe, character-based truncation**
/// for string-like types.
///
/// Unlike byte slicing (e.g. `&str[..n]`) or `String::truncate`,
/// these methods operate on Unicode scalar values (`char`),
/// guaranteeing that UTF-8 boundaries are never violated.
///
/// This prevents:
/// - invalid UTF-8
/// - panics caused by slicing at non-character boundaries
///
/// Typical use cases:
/// - UI text clipping
/// - log shortening
/// - safely handling CJK or emoji strings
///
/// # Provided methods
///
/// - [`truncate_chars`] allocates and returns a new `String`
/// - [`truncate_chars_ref`] returns a borrowed slice without allocation
///
/// Prefer [`truncate_chars_ref`] when possible for better performance.
pub(crate) trait SafeSplitExt {
    /// Returns a new `String` containing at most `max_chars` characters.
    ///
    /// The limit is based on **character count**, not byte length.
    ///
    /// If the string contains fewer than `max_chars` characters,
    /// the entire string is returned.
    ///
    /// This method **allocates**.
    ///
    /// # Complexity
    ///
    /// O(n)
    ///
    /// # Examples
    ///
    /// ```on_run
    /// use crate::utils::strer::SafeSplitExt;
    ///
    /// assert_eq!("hello".truncate_chars(2), "he");
    /// assert_eq!("你好世界".truncate_chars(2), "你好");
    /// assert_eq!("🚀rust".truncate_chars(1), "🚀");
    /// ```
    fn truncate_chars(&self, max_chars: usize) -> String;

    /// Returns a borrowed substring slice containing at most `max_chars`
    /// characters.
    ///
    /// This method performs **no allocation** and is therefore preferred
    /// in performance-critical paths.
    ///
    /// If the string is shorter than `max_chars`, the original slice is returned.
    ///
    /// # Complexity
    ///
    /// O(n)
    ///
    /// # Examples
    ///
    /// ```on_run
    /// use crate::utils::strer::SafeSplitExt;
    ///
    /// let s = String::from("你好世界");
    /// let sub = s.truncate_chars_ref(2);
    ///
    /// assert_eq!(sub, "你好");
    /// ```
    fn truncate_chars_ref(&self, max_chars: usize) -> &str;
}

impl<T: AsRef<str>> SafeSplitExt for T {
    #[inline]
    fn truncate_chars(&self, max_chars: usize) -> String {
        self.as_ref().chars().take(max_chars).collect()
    }

    #[inline]
    fn truncate_chars_ref(&self, max_chars: usize) -> &str {
        let s = self.as_ref();
        match s.char_indices().nth(max_chars) {
            Some((idx, _)) => &s[..idx],
            None => s,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // ---------------- Latin ----------------

    #[test]
    fn latin_ascii() {
        let s = "hello world";
        assert_eq!(s.truncate_chars(5), "hello");
        assert_eq!(s.truncate_chars_ref(5), "hello");
    }

    // ---------------- Chinese ----------------

    #[test]
    fn chinese() {
        let s = "你好世界";
        assert_eq!(s.truncate_chars(2), "你好");
        assert_eq!(s.truncate_chars_ref(3), "你好世");
    }

    // ---------------- Japanese ----------------

    #[test]
    fn japanese() {
        let s = "こんにちは世界";
        assert_eq!(s.truncate_chars(4), "こんにち");
    }

    // ---------------- Korean ----------------

    #[test]
    fn korean() {
        let s = "안녕하세요세계";
        assert_eq!(s.truncate_chars(3), "안녕하");
    }

    // ---------------- Emoji (4-byte UTF-8) ----------------

    #[test]
    fn emoji_simple() {
        let s = "🚀🔥✨rust";
        assert_eq!(s.truncate_chars(2), "🚀🔥");
    }

    // ---------------- Combining characters ----------------
    // e + ́ (U+0301)
    // 注意：这里会被拆成两个 char，这是正确行为

    #[test]
    fn combining_marks() {
        let s = "e\u{0301}cole";

        assert_eq!(s.chars().count(), 6);

        let first = s.truncate_chars(1);
        assert_eq!(first, "e"); // accent 被截断
    }

    // ---------------- ZWJ emoji sequence ----------------
    // family emoji: 👨‍👩‍👧‍👦
    // 由多个 scalar 组成

    #[test]
    fn zwj_sequence() {
        let s = "👨‍👩‍👧‍👦";

        // 多个 char
        assert!(s.chars().count() > 1);

        // 只取 1 会截断
        let part = s.truncate_chars(1);
        assert!(part.len() <= s.len());
    }

    // ---------------- Arabic (RTL) ----------------

    #[test]
    fn rtl_arabic() {
        let s = "مرحبا بالعالم";
        assert_eq!(s.truncate_chars(5), "مرحبا");
    }

    // ---------------- Mixed languages ----------------

    #[test]
    fn mixed_languages() {
        let s = "中🚀a한🙂b";

        assert_eq!(s.truncate_chars(1), "中");
        assert_eq!(s.truncate_chars(2), "中🚀");
        assert_eq!(s.truncate_chars(3), "中🚀a");
    }

    // ---------------- Boundary safety fuzz ----------------

    #[test]
    fn never_breaks_utf8_multilang() {
        let samples = [
            "hello",
            "你好世界",
            "こんにちは",
            "🚀🔥✨",
            "e\u{0301}cole",
            "👨‍👩‍👧‍👦",
            "مرحبا",
        ];

        for s in samples {
            for i in 0..20 {
                let out = s.truncate_chars(i);
                assert!(std::str::from_utf8(out.as_bytes()).is_ok());
            }
        }
    }

    // ---------------- zero allocation guarantee ----------------

    #[test]
    fn ref_is_slice() {
        let s = String::from("你好hello");

        let sub = s.truncate_chars_ref(2);

        assert_eq!(sub.as_ptr(), s.as_ptr());
    }

    proptest! {
        #[test]
        fn fuzz_unicode_never_panics(s in ".*", n in 0usize..100) {
            let _ = s.truncate_chars(n);
            let _ = s.truncate_chars_ref(n);
        }
    }
}
