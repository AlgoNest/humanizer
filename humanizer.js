    // Elements
    const humanizeBtn = document.getElementById("humanizeBtn");
    const clearBtn = document.getElementById("clearBtn");
    const copyBtn = document.getElementById("copyBtn");
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");
    const strengthSlider = document.getElementById("strength");
    const strengthValue = document.getElementById("strengthValue");
    const splitToggle = document.getElementById("splitToggle");
    const purposeSelect = document.getElementById("purpose");
    const progressBar = document.getElementById("progressBar");
    const progress = document.querySelector(".progress");
    const wordCountEl = document.getElementById("wordCount");
    const sentenceCountEl = document.getElementById("sentenceCount");

    // Update strength label
    strengthValue.textContent = strengthSlider.value;
    strengthSlider.addEventListener("input", () => {
      strengthValue.textContent = strengthSlider.value;
    });

    // Safe synonym dictionary (preserve meaning)
    const synonyms = {
      "important": ["crucial", "essential", "significant"],
      "good": ["great", "excellent", "positive"],
      "bad": ["poor", "unfavorable", "negative"],
      "show": ["demonstrate", "highlight", "reveal"],
      "use": ["utilize", "apply", "employ"],
      "big": ["large", "substantial", "considerable"],
      "small": ["minor", "limited", "modest"],
      "help": ["assist", "support", "aid"]
    };

    // Replace a single word with a safe synonym depending on strength
    function synonymReplace(word, strength) {
      const lower = word.toLowerCase().replace(/[^a-z0-9'-]/gi, "");
      if (!lower) return word;
      if (synonyms[lower] && Math.random() * 100 < strength / 2) {
        const options = synonyms[lower];
        const replacement = options[Math.floor(Math.random() * options.length)];
        // preserve capitalization and punctuation
        const capitalized = /^[A-Z]/.test(word);
        const trailing = word.match(/[^A-Za-z0-9'-]+$/);
        const trailingStr = trailing ? trailing[0] : "";
        return capitalized ? replacement.charAt(0).toUpperCase() + replacement.slice(1) + trailingStr
                           : replacement + trailingStr;
      }
      return word;
    }

    // Split text into sentences (robust, works without lookbehind)
    function splitIntoSentences(text) {
      // match sequences that end with punctuation or end of string
      const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
      return matches ? matches.map(s => s.trim()) : [];
    }

    // Main humanizer — preserves meaning, applies soft controlled changes
    function humanizeTextCore(text, strength, splitParagraphs, purpose) {
      const sentences = splitIntoSentences(text);
      const processed = sentences.map((sentence) => {
        if (!sentence) return "";

        // tokenize by spaces to preserve punctuation tokens
        const tokens = sentence.split(/\s+/);
        // find candidate indices that are words (not only punctuation)
        const candidateIndices = [];
        for (let i = 0; i < tokens.length; i++) {
          if (/[A-Za-z0-9]/.test(tokens[i])) candidateIndices.push(i);
        }

        // safe synonym replacement: pick one candidate (based on strength)
        if (candidateIndices.length && Math.random() * 100 < strength) {
          const pickIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
          tokens[pickIndex] = synonymReplace(tokens[pickIndex], strength);
        }

        let s = tokens.join(" ");

        // small, non-destructive variation for readability (rare)
        if (Math.random() * 100 < Math.max(0, strength - 60)) {
          // mild insertion of a short hedging phrase (when high strength)
          // Only insert if sentence is long enough and doesn't already start with a hedge
          if (s.length > 50 && !/^(In fact|Interestingly|Research|According)/i.test(s)) {
            if (purpose === "academic") {
              // academic: use formal hedge
              s = "Research suggests that " + s;
            } else if (purpose === "article" || purpose === "blog") {
              s = "In fact, " + s;
            } else if (purpose === "story") {
              s = "Imagine this: " + s;
            } else if (purpose === "social") {
              // social: keep short, rarely add emoji
              if (Math.random() > 0.8) s = "👉 " + s;
            } else if (purpose === "copy") {
              if (Math.random() > 0.8) s += " Don't miss out!";
            }
          }
        }

        // minor phrasing tweak: "is" -> "is actually" but only rarely and not in academic mode
        if (Math.random() * 100 < Math.max(0, strength - 55) && purpose !== "academic") {
          s = s.replace(/\bis\b/gi, (m) => (Math.random() > 0.6 ? m + " actually" : m));
        }

        return s;
      });

      // If paragraph splitting off, just join sentences as-is
      if (!splitParagraphs) return processed.join(" ");

      // Group into natural paragraphs of 2-4 sentences
      const paragraphs = [];
      let temp = [];
      processed.forEach((s, i) => {
        if (!s) return;
        temp.push(s);
        // create paragraph when temp reaches 2-4 sentences (weighted randomness)
        if (temp.length >= 2 && (temp.length >= 4 || Math.random() > 0.6 || i === processed.length - 1)) {
          paragraphs.push(temp.join(" "));
          temp = [];
        }
      });
      if (temp.length) paragraphs.push(temp.join(" "));
      return paragraphs.join("\n\n");
    }

    // Stats helper
    function updateStats(text) {
      const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
      const sentences = splitIntoSentences(text).filter(s => s.trim()).length;
      wordCountEl.textContent = words;
      sentenceCountEl.textContent = sentences;
      wordCountEl.textContent = words;
      sentenceCountEl.textContent = sentences;
    }

    // === UI interactions ===
    function setUIEnabled(enabled) {
      humanizeBtn.disabled = !enabled;
      clearBtn.disabled = !enabled;
      copyBtn.disabled = !enabled;
      inputText.disabled = !enabled;
      strengthSlider.disabled = !enabled;
      splitToggle.disabled = !enabled;
      purposeSelect.disabled = !enabled;
    }

    humanizeBtn.addEventListener("click", () => {
      const text = inputText.value.trim();
      if (!text) {
        alert("Please paste some text first!");
        return;
      }

      // start progress
      setUIEnabled(false);
      progress.style.display = "block";
      progressBar.style.width = "0%";

      // animate progress to 90%
      let width = 0;
      const interval = setInterval(() => {
        width = Math.min(90, width + Math.floor(Math.random() * 12) + 6); // random increments
        progressBar.style.width = width + "%";
      }, 160);

      // simulate processing time (fast) — still long enough to show progress
      const delay = 900 + Math.floor(Math.random() * 600);
      setTimeout(() => {
        clearInterval(interval);
        const strength = parseInt(strengthSlider.value || "50", 10);
        const split = splitToggle.checked;
        const purpose = purposeSelect.value;

        const result = humanizeTextCore(text, strength, split, purpose);
        outputText.value = result;
        updateStats(result);

        // finish progress
        progressBar.style.width = "100%";
        setTimeout(() => {
          progress.style.display = "none";
          progressBar.style.width = "0%";
        }, 300);

        setUIEnabled(true);
      }, delay);
    });

    clearBtn.addEventListener("click", () => {
      inputText.value = "";
      outputText.value = "";
      updateStats("");
    });

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(outputText.value);
        alert("Output copied to clipboard!");
      } catch (e) {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = outputText.value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        alert("Output copied to clipboard!");
      }
    });

    // wire updateStats to input changes so users see original counts
    inputText.addEventListener("input", () => updateStats(inputText.value));
    // expose core function name for clarity
    function humanizeTextCore(text, strength, splitParagraphs, purpose) {
      return humanizeTextCore_impl(text, strength, splitParagraphs, purpose);
    }
    // implementation kept in a named function to avoid hoisting confusion:
    function humanizeTextCore_impl(text, strength, splitParagraphs, purpose) {
      return humanizeTextCore_impl_inner(text, strength, splitParagraphs, purpose);
    }
    // Real implementation (call the real function defined earlier)
    function humanizeTextCore_impl_inner(text, strength, splitParagraphs, purpose) {
      // call the actual core implementation above
      return humanizeTextCoreDirect(text, strength, splitParagraphs, purpose);
    }

    // To avoid confusion in function names, call the main implementation directly:
    function humanizeTextCoreDirect(text, strength, splitParagraphs, purpose) {
      return (function inner() {
        // reuse previously defined function humanizeTextCore (declared earlier)
        return humanizeTextCore_call(text, strength, splitParagraphs, purpose);
      })();
    }

    // Helper to call the actual humanizeTextCore implementation above
    function humanizeTextCore_call(text, strength, splitParagraphs, purpose) {
      // We defined humanizeTextCore earlier in this script block — call it.
      // But because of function ordering, call the standalone implementation defined above:
      return (function() {
        // Directly run the implementation above that uses splitIntoSentences & synonymReplace
        const sentences = splitIntoSentences(text);
        const processed = sentences.map((sentence) => {
          if (!sentence) return "";

          const tokens = sentence.split(/\s+/);
          const candidateIndices = [];
          for (let i = 0; i < tokens.length; i++) {
            if (/[A-Za-z0-9]/.test(tokens[i])) candidateIndices.push(i);
          }

          if (candidateIndices.length && Math.random() * 100 < strength) {
            const pickIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
            tokens[pickIndex] = synonymReplace(tokens[pickIndex], strength);
          }

          let s = tokens.join(" ");

          if (Math.random() * 100 < Math.max(0, strength - 60)) {
            if (s.length > 50 && !/^(In fact|Interestingly|Research|According)/i.test(s)) {
              if (purpose === "academic") {
                s = "Research suggests that " + s;
              } else if (purpose === "article" || purpose === "blog") {
                s = "In fact, " + s;
              } else if (purpose === "story") {
                s = "Imagine this: " + s;
              } else if (purpose === "social") {
                if (Math.random() > 0.8) s = "👉 " + s;
              } else if (purpose === "copy") {
                if (Math.random() > 0.8) s += " Don't miss out!";
              }
            }
          }

          if (Math.random() * 100 < Math.max(0, strength - 55) && purpose !== "academic") {
            s = s.replace(/\bis\b/gi, (m) => (Math.random() > 0.6 ? m + " actually" : m));
          }

          return s;
        });

        if (!splitParagraphs) return processed.join(" ");

        const paragraphs = [];
        let temp = [];
        processed.forEach((s, i) => {
          if (!s) return;
          temp.push(s);
          if (temp.length >= 2 && (temp.length >= 4 || Math.random() > 0.6 || i === processed.length - 1)) {
            paragraphs.push(temp.join(" "));
            temp = [];
          }
        });
        if (temp.length) paragraphs.push(temp.join(" "));
        return paragraphs.join("\n\n");
      })();
    }

    // initialize stats
    updateStats("");
  </script>

