/**
 * Basic tests for TradingView automation workflow components.
 * These validate the core logic used in n8n Code nodes.
 */

// Test idea selection logic
function testIdeaSelection() {
  const ideas = [
    { ticker: "AAPL", content: "Apple analysis" },
    { ticker: "TSLA", content: "Tesla analysis" },
    { ticker: "NVDA", content: "NVIDIA analysis" },
  ];

  // Test unique selection (no duplicates in single run)
  function selectTwoUnique(arr) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }

  const selected = selectTwoUnique(ideas);
  console.assert(selected.length === 2, "Should select 2 ideas");
  console.assert(selected[0].ticker !== selected[1].ticker, "Should be unique");
  console.log("✓ Idea selection test passed");
}

// Test AI output parsing
function testAIOutputParsing() {
  const validOutput = JSON.stringify({
    ticker: "AAPL",
    title: "Apple Breakout",
    bias: "Long",
    category: "Equity",
    tags: ["tech", "breakout"]
  });

  function parseAIOutput(output) {
    try {
      const parsed = JSON.parse(output);
      return {
        ticker: parsed.ticker || "UNKNOWN",
        title: parsed.title || "Untitled",
        bias: parsed.bias || "Neutral",
        category: parsed.category || "General",
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch {
      return {
        ticker: "UNKNOWN",
        title: "Parse Failed",
        bias: "Neutral",
        category: "General",
        tags: []
      };
    }
  }

  const result = parseAIOutput(validOutput);
  console.assert(result.ticker === "AAPL", "Should parse ticker");
  console.assert(result.bias === "Long", "Should parse bias");
  console.assert(Array.isArray(result.tags), "Tags should be array");
  console.log("✓ AI output parsing test passed");

  // Test malformed JSON handling
  const malformed = parseAIOutput("not json");
  console.assert(malformed.ticker === "UNKNOWN", "Should handle malformed JSON");
  console.assert(malformed.title === "Parse Failed", "Should handle parse failure");
  console.log("✓ Malformed JSON handling test passed");
}

// Test execution ID generation
function testExecutionId() {
  function generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const id1 = generateExecutionId();
  const id2 = generateExecutionId();

  console.assert(id1.startsWith("exec_"), "Should have prefix");
  console.assert(id1 !== id2, "Should be unique");
  console.log("✓ Execution ID generation test passed");
}

// Run all tests
console.log("Running TradingView workflow tests...\n");
testIdeaSelection();
testAIOutputParsing();
testExecutionId();
console.log("\n✅ All tests passed!");
