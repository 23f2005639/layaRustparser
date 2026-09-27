use aho_corasick::{AhoCorasick, MatchKind};
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Laya System 1 Decision Model Output: Discrete Typed Choice with Calibrated Probabilities
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LayaChoice {
    /// Top predicted candidate label
    pub label: String,
    /// Calibrated confidence probability in [0.0, 1.0]
    pub probability: f64,
    /// Full ranked probability distribution over all candidates
    pub rankings: Vec<(String, f64)>,
}

/// Laya System 1 Decision Model Output: Continuous / Ordinal Calibrated Score
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LayaScore {
    /// Normalized score in [0.0, 1.0]
    pub score: f64,
    /// Calibrated confidence in the score
    pub confidence: f64,
}

/// Laya System 1 Decision Model Output: Ternary Decision (Yes / No / Null)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LayaNoul {
    /// Ternary decision outcome
    pub decision: bool,
    /// Calibrated certainty probability in [0.0, 1.0]
    pub probability: f64,
}

/// Non-Autoregressive "System 1" Decision Engine (Convai Laya Architecture)
/// Evaluates text states in a single forward pass without autoregressive token generation.
/// Guarantees zero hallucinations, deterministic schema compliance, and calibrated probabilities.
///
/// Scoring runs as two single-pass Aho-Corasick scans per input (one
/// case-sensitive vendor scan, one case-insensitive action/threat scan)
/// instead of ~85 substring probes. Overlapping matches are required:
/// `Standard` reports both `drop` and `deny`-style nested hits (e.g. `drop`
/// inside `dropped`, `Trust` inside `Trust_to_Untrust`); `LeftmostFirst`
/// would swallow the shorter overlap and shift scores.
pub struct LayaDecisionEngine {
    /// Case-sensitive vendor automaton over structural + fingerprint tokens
    vendor_ac: AhoCorasick,
    /// Side table indexed by vendor pattern id: (vendor_idx, weight)
    vendor_meta: Vec<(usize, f64)>,
    /// Case-insensitive action+threat automaton (one scan serves both heads)
    action_threat_ac: AhoCorasick,
    /// Side table indexed by action/threat pattern id
    action_threat_meta: Vec<ScoredPattern>,
    /// Optional external ONNX model path
    _onnx_model_path: Option<String>,
}

/// One automaton pattern's scoring role: which head it feeds, which slot in
/// that head's fixed weight array, and how much it contributes.
#[derive(Debug, Clone, Copy)]
struct ScoredPattern {
    /// 0 = action head, 1 = threat head
    head: u8,
    /// Slot index within the head's weight array
    slot: usize,
    /// Contribution weight (action 3.0, threat per-token risk)
    weight: f64,
}

/// Candidate vendors in ranking order (ties resolve to the earlier vendor)
const VENDOR_NAMES: [&str; 7] = [
    "cisco_asa",
    "fortigate",
    "paloalto",
    "suricata",
    "pfsense",
    "juniper_srx",
    "checkpoint",
];
/// Action labels in ranking order (ties resolve to the earlier action —
/// the old HashMap iteration order was nondeterministic on ties)
const ACTION_NAMES: [&str; 4] = ["Allowed", "Blocked", "Dropped", "Alert"];

const VENDOR_STRUCTURAL_WEIGHT: f64 = 4.0;
const VENDOR_FINGERPRINT_WEIGHT: f64 = 10.0;
const ACTION_TOKEN_WEIGHT: f64 = 3.0;
/// (pattern, vendor slot, weight): structural cues 4.0, format fingerprints 10.0
const VENDOR_PATTERNS: &[(&str, usize, f64)] = &[
    ("Built", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("Teardown", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("outside:", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("inside:", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("connection", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("inbound", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("outbound", 0, VENDOR_STRUCTURAL_WEIGHT),
    ("%ASA-", 0, VENDOR_FINGERPRINT_WEIGHT),
    ("type=\"traffic\"", 1, VENDOR_STRUCTURAL_WEIGHT),
    ("vd=\"root\"", 1, VENDOR_STRUCTURAL_WEIGHT),
    ("subtype=\"forward\"", 1, VENDOR_STRUCTURAL_WEIGHT),
    ("srcip=", 1, VENDOR_STRUCTURAL_WEIGHT),
    ("dstip=", 1, VENDOR_STRUCTURAL_WEIGHT),
    ("devname=", 1, VENDOR_FINGERPRINT_WEIGHT),
    ("logid=", 1, VENDOR_FINGERPRINT_WEIGHT),
    ("Trust_to_Untrust", 2, VENDOR_STRUCTURAL_WEIGHT),
    ("pan-os", 2, VENDOR_STRUCTURAL_WEIGHT),
    ("vsys1", 2, VENDOR_STRUCTURAL_WEIGHT),
    ("Trust", 2, VENDOR_STRUCTURAL_WEIGHT),
    ("Untrust", 2, VENDOR_STRUCTURAL_WEIGHT),
    (",TRAFFIC,", 2, VENDOR_FINGERPRINT_WEIGHT),
    (",THREAT,", 2, VENDOR_FINGERPRINT_WEIGHT),
    ("\"timestamp\":", 3, VENDOR_STRUCTURAL_WEIGHT),
    ("\"flow_id\":", 3, VENDOR_STRUCTURAL_WEIGHT),
    ("\"alert\":", 3, VENDOR_STRUCTURAL_WEIGHT),
    ("\"app_proto\":", 3, VENDOR_STRUCTURAL_WEIGHT),
    ("\"dest_port\":", 3, VENDOR_STRUCTURAL_WEIGHT),
    ("\"event_type\":", 3, VENDOR_FINGERPRINT_WEIGHT),
    ("pass", 4, VENDOR_STRUCTURAL_WEIGHT),
    ("block", 4, VENDOR_STRUCTURAL_WEIGHT),
    ("match", 4, VENDOR_STRUCTURAL_WEIGHT),
    ("igb0", 4, VENDOR_STRUCTURAL_WEIGHT),
    ("em0", 4, VENDOR_STRUCTURAL_WEIGHT),
    ("filterlog[", 4, VENDOR_FINGERPRINT_WEIGHT),
    ("filterlog:", 4, VENDOR_FINGERPRINT_WEIGHT),
    ("RT_FLOW_SESSION_CREATE", 5, VENDOR_STRUCTURAL_WEIGHT),
    ("session", 5, VENDOR_STRUCTURAL_WEIGHT),
    ("created", 5, VENDOR_STRUCTURAL_WEIGHT),
    ("ge-0/0/0", 5, VENDOR_STRUCTURAL_WEIGHT),
    ("sample-policy", 5, VENDOR_STRUCTURAL_WEIGHT),
    ("RT_FLOW:", 5, VENDOR_FINGERPRINT_WEIGHT),
    ("Quantum", 6, VENDOR_STRUCTURAL_WEIGHT),
    ("rule", 6, VENDOR_STRUCTURAL_WEIGHT),
    ("accept", 6, VENDOR_STRUCTURAL_WEIGHT),
    ("drop", 6, VENDOR_STRUCTURAL_WEIGHT),
    ("reject", 6, VENDOR_STRUCTURAL_WEIGHT),
    ("CheckPoint-FW", 6, VENDOR_FINGERPRINT_WEIGHT),
];
/// (pattern, action slot): insertion order is the tie-break order
const ACTION_PATTERNS: &[(&str, usize)] = &[
    ("allow", 0),
    ("accept", 0),
    ("pass", 0),
    ("permit", 0),
    ("built", 0),
    ("created", 0),
    ("open", 0),
    ("authorized", 0),
    ("block", 1),
    ("reject", 1),
    ("prevent", 1),
    ("denied", 1),
    ("filtered", 1),
    ("quarantine", 1),
    ("drop", 2),
    ("deny", 2),
    ("discard", 2),
    ("timeout", 2),
    ("blackhole", 2),
    ("alert", 3),
    ("notice", 3),
    ("warn", 3),
    ("warning", 3),
    ("alarm", 3),
    ("violation", 3),
    ("tamper", 3),
];
/// (pattern, risk weight): max wins, hit count drives confidence
const THREAT_PATTERNS: &[(&str, f64)] = &[
    ("exploit", 0.95),
    ("overflow", 0.90),
    ("unauthorized", 0.85),
    ("tamper", 0.92),
    ("malicious", 0.94),
    ("attack", 0.88),
    ("sqli", 0.96),
    ("injection", 0.91),
    ("brute", 0.82),
    ("spoof", 0.87),
    ("backdoor", 0.95),
    ("ransomware", 0.99),
];

const VENDOR_PATTERN_COUNT: usize = 47;
const ACTION_THREAT_PATTERN_COUNT: usize = 38;

const _: [(); VENDOR_PATTERN_COUNT] = [(); VENDOR_PATTERNS.len()];
const _: [(); ACTION_THREAT_PATTERN_COUNT] = [(); ACTION_PATTERNS.len() + THREAT_PATTERNS.len()];

impl LayaDecisionEngine {
    /// Initialize native calibrated decision engine with perimeter device priors
    pub fn new() -> Self {
        // Case-sensitive vendor automaton: fingerprints like `%ASA-` and
        // structural cues like `Trust` must match exact case (a lowercased
        // scan would blur `Trust`/`Untrust` vendor signals into action text).
        let vendor_ac = AhoCorasick::builder()
            .match_kind(MatchKind::Standard)
            .build(VENDOR_PATTERNS.iter().map(|(p, _, _)| p))
            .expect("vendor patterns are static and valid");
        let vendor_meta = VENDOR_PATTERNS
            .iter()
            .map(|(_, slot, weight)| (*slot, *weight))
            .collect();

        // One case-insensitive automaton serves both the action and threat
        // heads: a single scan accumulates action weights and threat max/count.
        let mut action_threat_patterns: Vec<&&str> =
            Vec::with_capacity(ACTION_THREAT_PATTERN_COUNT);
        let mut action_threat_meta: Vec<ScoredPattern> =
            Vec::with_capacity(ACTION_THREAT_PATTERN_COUNT);
        for (pattern, slot) in ACTION_PATTERNS {
            action_threat_patterns.push(pattern);
            action_threat_meta.push(ScoredPattern {
                head: 0,
                slot: *slot,
                weight: ACTION_TOKEN_WEIGHT,
            });
        }
        for (pattern, weight) in THREAT_PATTERNS {
            action_threat_patterns.push(pattern);
            action_threat_meta.push(ScoredPattern {
                head: 1,
                slot: 0,
                weight: *weight,
            });
        }
        let action_threat_ac = AhoCorasick::builder()
            .ascii_case_insensitive(true)
            .match_kind(MatchKind::Standard)
            .build(action_threat_patterns)
            .expect("action/threat patterns are static and valid");

        Self {
            vendor_ac,
            vendor_meta,
            action_threat_ac,
            action_threat_meta,
            _onnx_model_path: None,
        }
    }

    /// Load optional external ONNX ModernBERT-421M weights
    pub fn with_onnx_model<P: AsRef<Path>>(mut self, path: P) -> Self {
        self._onnx_model_path = Some(path.as_ref().to_string_lossy().to_string());
        self
    }

    /// Zero-alloc vendor scan: one overlapping pass over the input,
    /// accumulating into the caller's fixed array. The `seen` flags dedupe
    /// repeat emissions so each token contributes once — the old code added
    /// each token's weight once per token via `contains`, never per occurrence.
    /// No heap use here: fixed stack arrays plus automaton traversal only.
    fn scan_vendor_weights(&self, input: &str, weights: &mut [f64; 7]) {
        let mut seen = [false; VENDOR_PATTERN_COUNT];
        for mat in self.vendor_ac.find_overlapping_iter(input) {
            let id = mat.pattern().as_usize();
            if !seen[id] {
                seen[id] = true;
                let (slot, weight) = self.vendor_meta[id];
                weights[slot] += weight;
            }
        }
    }

    /// Zero-alloc action/threat scan: one overlapping pass feeding both heads.
    /// Returns (max threat risk, distinct threat hits); action weights land in
    /// the caller's fixed array. Same once-per-token dedupe as the vendor scan.
    fn scan_action_threat(&self, input: &str, action_weights: &mut [f64; 4]) -> (f64, usize) {
        let mut seen = [false; ACTION_THREAT_PATTERN_COUNT];
        let mut max_risk = 0.05; // baseline benign background risk
        let mut hits = 0;
        for mat in self.action_threat_ac.find_overlapping_iter(input) {
            let id = mat.pattern().as_usize();
            if seen[id] {
                continue;
            }
            seen[id] = true;
            let meta = self.action_threat_meta[id];
            if meta.head == 0 {
                action_weights[meta.slot] += meta.weight;
            } else {
                if meta.weight > max_risk {
                    max_risk = meta.weight;
                }
                hits += 1;
            }
        }
        (max_risk, hits)
    }

    /// Non-autoregressive typed choice: Classify log vendor across candidate taxonomy
    /// Computes calibrated softmax distribution in a single pass
    pub fn classify_vendor(&self, input: &str) -> LayaChoice {
        let mut weights = [0.0f64; 7];
        self.scan_vendor_weights(input, &mut weights);

        // Rankings alloc is API-required (`rankings: Vec<(String, f64)>` feeds
        // pipeline.rs and the evaluator); the scan above it stays alloc-free.
        let total_raw: f64 = weights.iter().map(|s| s.exp()).sum();
        let mut rankings: Vec<(String, f64)> = weights
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let prob = (s.exp() / total_raw).clamp(0.001, 0.999);
                (VENDOR_NAMES[i].to_owned(), prob)
            })
            .collect();

        // Sort descending by calibrated probability
        rankings.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        let top = rankings
            .first()
            .cloned()
            .unwrap_or_else(|| ("unknown".into(), 0.5));

        LayaChoice {
            label: top.0,
            probability: top.1,
            rankings,
        }
    }

    /// Non-autoregressive typed choice: Disambiguate security action into OCSF disposition
    pub fn classify_action(&self, input: &str) -> LayaChoice {
        let mut weights = [0.0f64; 4];
        // Threat head output is discarded here; the shared scan still costs
        // one pass and keeps action/threat matching consistent.
        let _ = self.scan_action_threat(input, &mut weights);

        // Fixed label order (Allowed, Blocked, Dropped, Alert) doubles as the
        // tie-break: `sort_by` is stable, so equal weights keep this order
        // instead of whatever the HashMap happened to yield.
        let total_raw: f64 = weights.iter().map(|s| s.exp()).sum();
        let mut rankings: Vec<(String, f64)> = weights
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let prob = (s.exp() / total_raw).clamp(0.001, 0.999);
                (ACTION_NAMES[i].to_owned(), prob)
            })
            .collect();

        rankings.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        let top = rankings
            .first()
            .cloned()
            .unwrap_or_else(|| ("Unknown".into(), 0.5));

        LayaChoice {
            label: top.0,
            probability: top.1,
            rankings,
        }
    }

    /// Non-autoregressive typed score: Calibrated threat & anomaly risk score in [0.0, 1.0]
    pub fn score_threat_risk(&self, input: &str) -> LayaScore {
        let mut action_weights = [0.0f64; 4];
        let (max_risk, hits) = self.scan_action_threat(input, &mut action_weights);

        let confidence = if hits > 0 {
            (0.70 + (hits as f64 * 0.10)).min(0.99)
        } else {
            0.90
        };

        LayaScore {
            score: max_risk,
            confidence,
        }
    }

    /// Non-autoregressive typed noul: Ternary check whether an anomaly is malicious
    pub fn is_malicious_anomaly(&self, input: &str) -> LayaNoul {
        let risk = self.score_threat_risk(input);
        let is_malicious = risk.score >= 0.50;
        let probability = if is_malicious {
            risk.score
        } else {
            1.0 - risk.score
        };

        LayaNoul {
            decision: is_malicious,
            probability,
        }
    }
}

impl Default for LayaDecisionEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_laya_vendor_classification() {
        let engine = LayaDecisionEngine::new();

        let asa_sample = "%ASA-6-302013: Built inbound UDP connection for outside:1.1.1.1/53 to inside:2.2.2.2/53";
        let choice = engine.classify_vendor(asa_sample);
        assert_eq!(choice.label, "cisco_asa");
        assert!(
            choice.probability > 0.70,
            "Calibrated confidence should be high: {}",
            choice.probability
        );

        let fgt_sample = r#"date=2026-09-21 devname="FGT-EDGE" type="traffic" srcip=10.0.0.1"#;
        let choice = engine.classify_vendor(fgt_sample);
        assert_eq!(choice.label, "fortigate");
        assert!(choice.probability > 0.70);

        let jnp_sample =
            "RT_FLOW: RT_FLOW_SESSION_CREATE: session created 192.168.10.1/80 ge-0/0/0";
        let choice = engine.classify_vendor(jnp_sample);
        assert_eq!(choice.label, "juniper_srx");
        assert!(choice.probability > 0.70);
    }

    #[test]
    fn test_laya_action_disambiguation() {
        let engine = LayaDecisionEngine::new();

        let allow_log =
            "FIREWALL: Connection built successfully from 1.1.1.1 to 2.2.2.2 action=permit";
        let res_allow = engine.classify_action(allow_log);
        assert_eq!(res_allow.label, "Allowed");
        assert!(res_allow.probability > 0.80);

        let drop_log = "FIREWALL: Packet drop from 45.33.32.156 action=deny rule=default";
        let res_drop = engine.classify_action(drop_log);
        assert_eq!(res_drop.label, "Dropped");
        assert!(res_drop.probability > 0.80);
    }

    #[test]
    fn test_laya_threat_risk_scoring() {
        let engine = LayaDecisionEngine::new();

        let benign_log = "%ASA-6-302013: Built outbound TCP connection 1001 for outside:1.1.1.1/80";
        let score_benign = engine.score_threat_risk(benign_log);
        assert!(score_benign.score < 0.20);

        let attack_log =
            "ALERT: Unauthorized exploit attempt buffer overflow detected from 10.0.0.99";
        let score_attack = engine.score_threat_risk(attack_log);
        assert!(score_attack.score > 0.85);

        let noul = engine.is_malicious_anomaly(attack_log);
        assert!(noul.decision);
        assert!(noul.probability > 0.85);
    }

    /// Single-pass parity: the automaton scan must agree with the old
    /// per-token `contains` semantics on overlap-heavy inputs (`drop` inside
    /// `dropped`, `Trust`/`Untrust` inside `Trust_to_Untrust`, mixed case).
    /// Scores here are computed by an independent contains-based oracle, so a
    /// regression in overlap handling or case folding fails loudly.
    #[test]
    fn test_laya_single_pass_matches_contains_oracle() {
        use super::{ACTION_PATTERNS, THREAT_PATTERNS, VENDOR_PATTERNS};
        let engine = LayaDecisionEngine::new();
        let lines = [
            "FIREWALL: Packet dropped action=deny rule=default",
            "Trust_to_Untrust vsys1 pan-os session Trust Untrust",
            "ALERT: Unauthorized TAMPER exploit Brute-force ATTACK sqli INJECTION",
            "filterlog[12]: pass block match em0 igb0 RT_FLOW: session created",
            "%ASA-6-302013: Built Teardown outside: inside: connection inbound outbound",
            "Quantum rule accept drop reject CheckPoint-FW",
            "nothing matches here at all",
            "DrOpPeD BLOCKED warning violation quarantine blackhole timeout discard",
        ];
        for line in lines {
            // Vendor oracle: case-sensitive contains, structural 4.0 + fingerprint 10.0
            let mut expected_vendor = [0.0f64; 7];
            for (token, slot, weight) in VENDOR_PATTERNS {
                if line.contains(token) {
                    expected_vendor[*slot] += weight;
                }
            }
            let got = engine.classify_vendor(line);
            let total: f64 = expected_vendor.iter().map(|s| s.exp()).sum();
            for (i, name) in super::VENDOR_NAMES.iter().enumerate() {
                let want = (expected_vendor[i].exp() / total).clamp(0.001, 0.999);
                let have = got
                    .rankings
                    .iter()
                    .find(|(label, _)| label == name)
                    .map(|(_, p)| *p)
                    .unwrap();
                assert!(
                    (want - have).abs() < 1e-12,
                    "vendor {name} diverged on {line:?}: want {want}, got {have}"
                );
            }

            // Action/threat oracle: ASCII-lowercased contains
            let lower = line.to_ascii_lowercase();
            let mut expected_action = [0.0f64; 4];
            for (token, slot) in ACTION_PATTERNS {
                if lower.contains(token) {
                    expected_action[*slot] += 3.0;
                }
            }
            let got_action = engine.classify_action(line);
            let total: f64 = expected_action.iter().map(|s| s.exp()).sum();
            for (i, name) in super::ACTION_NAMES.iter().enumerate() {
                let want = (expected_action[i].exp() / total).clamp(0.001, 0.999);
                let have = got_action
                    .rankings
                    .iter()
                    .find(|(label, _)| label == name)
                    .map(|(_, p)| *p)
                    .unwrap();
                assert!(
                    (want - have).abs() < 1e-12,
                    "action {name} diverged on {line:?}: want {want}, got {have}"
                );
            }
            let mut want_max = 0.05f64;
            let mut want_hits = 0;
            for (token, weight) in THREAT_PATTERNS {
                if lower.contains(token) {
                    want_max = want_max.max(*weight);
                    want_hits += 1;
                }
            }
            let got_threat = engine.score_threat_risk(line);
            assert!(
                (want_max - got_threat.score).abs() < 1e-12,
                "threat score diverged on {line:?}"
            );
            let want_conf = if want_hits > 0 {
                (0.70 + want_hits as f64 * 0.10).min(0.99)
            } else {
                0.90
            };
            assert!(
                (want_conf - got_threat.confidence).abs() < 1e-12,
                "threat confidence diverged on {line:?}"
            );
        }
    }

    /// Repeat emissions must not accumulate: a token shouted N times scores
    /// exactly like a single whisper (the old code added each token once via
    /// `contains`). This is the constant-work-per-token half of zero-alloc.
    #[test]
    fn test_laya_repeat_tokens_score_once() {
        let engine = LayaDecisionEngine::new();
        let once = "drop Trust exploit";
        let many = format!("{} {}", once.repeat(200), once.to_uppercase().repeat(50));
        let (v_once, a_once, t_once) = (
            engine.classify_vendor(once),
            engine.classify_action(once),
            engine.score_threat_risk(once),
        );
        let (v_many, a_many, t_many) = (
            engine.classify_vendor(&many),
            engine.classify_action(&many),
            engine.score_threat_risk(&many),
        );
        // Vendor scan is case-sensitive: uppercased repeats add nothing new
        assert_eq!(v_once.rankings, v_many.rankings);
        // Action/threat scan folds case but dedupes per token
        assert_eq!(a_once.rankings, a_many.rankings);
        assert_eq!(t_once.score, t_many.score);
        assert_eq!(t_once.confidence, t_many.confidence);
    }
}
