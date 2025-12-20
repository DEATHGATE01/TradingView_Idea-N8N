# CrowdWisdomTrading – TradingView Idea Automation using n8n

## Overview

This project was developed as part of the internship assessment for **CrowdWisdomTrading**.
The goal was to design a real-world automation workflow using **n8n** and an **AI agent** to simulate how trading ideas can be prepared, enriched, and posted on **TradingView** with minimal manual effort.

Since n8n is still relatively new in the Indian market, I approached this assignment with the intent to deeply explore its capabilities while building a reliable, production-safe workflow that can handle unexpected data structures rather than only working in ideal conditions.

---

## Project Goals

* Select trading ideas dynamically from a predefined pool
* Use an AI agent to extract structured trading metadata from raw text
* Automate the TradingView posting flow step by step
* Build a workflow that is debuggable, traceable, and resilient to failure

---

## Tech Stack

* **Automation Framework:** n8n (Self-Hosted)
* **LLM Provider:** OpenRouter / Gemini (Free tier)
* **Idea Storage:** Google Drive (TXT files)
* **Target Platform:** TradingView (UI automation)
* **Scripting:** JavaScript (n8n Code nodes)

---

## Workflow Summary

1. **Manual Trigger**

   * Starts a new execution
   * Generates a unique `execution_id` used across the entire flow

2. **Idea Source**

   * Five TXT files stored in Google Drive
   * Each file contains one trading idea for a unique ticker

3. **Random Selection**

   * Two ideas are randomly selected per execution
   * Ensures no duplicate idea is processed in a single run

4. **AI Enrichment**

   * Each idea is processed by an AI agent to extract:

     * Ticker
     * Title
     * Bias (Long / Short / Neutral)
     * Category
     * Tags
   * Output is forced into a predictable JSON structure

5. **TradingView Automation**

   * Search and select the ticker
   * Paste title and idea text
   * Select bias checkboxes
   * Select category and tags
   * Attempt to publish the idea

6. **Logging**

   * Each processed idea logs:

     * `execution_id`
     * Ticker
     * Published flag
     * Final status

---

## Key Challenges & How I Solved Them

### 1. Understanding n8n's Data Flow Model

**Challenge:**
Initially, I misunderstood how n8n handles multiple items across nodes. Some nodes forwarded only one item while others silently dropped data, which caused missing rows, incomplete logs, and confusing behavior.

**Solution:**
I learned to:

* Inspect item counts at every stage
* Use `$input.all()` correctly in Code nodes
* Avoid assumptions about item shape

This significantly improved workflow predictability.

---

### 2. Inconsistent AI Output Breaking Downstream Logic

**Challenge:**
AI responses were not always consistent. Missing fields or unexpected formatting caused runtime errors and empty Google Sheet columns.

**Solution:**

* Enforced strict JSON-only output from the AI
* Added defensive parsing with safe fallbacks
* Defaulted missing fields instead of failing execution

This made the workflow resilient even when AI responses were imperfect.

---

### 3. Timestamp & Dynamic Expression Issues

**Challenge:**
Timestamps were initially logged as literal strings like `{{now}}` instead of actual values, due to incorrect usage of expressions across nodes.

**Solution:**

* Centralized timestamp generation inside a Code node
* Ensured timestamps were computed, not templated

---

### 4. Merge Node Behavior & Field Collisions

**Challenge:**
While merging AI data and execution results, fields were overwritten or became `undefined`, leading to JSON parsing errors and missing values.

**Solution:**

* Carefully aligned merge strategy
* Explicitly validated fields before usage
* Avoided nested JSON where not required

---

### 5. UI Automation Instability on TradingView

**Challenge:**
TradingView's UI elements are dynamic and occasionally slow to load, causing timeouts or element-not-found errors.

**Solution:**

* Added waiting logic
* Designed the flow to fail gracefully and log failures instead of crashing
* Ensured sequential posting (one idea at a time)

---

### 6. Logging Without Breaking the Workflow

**Challenge:**
Adding logging initially caused duplicate entries, missing rows, or blocked execution when upstream nodes failed.

**Solution:**

* Simplified logging to core fields only
* Used `execution_id` for traceability
* Ensured logging nodes never block the main flow

---

## Platform Limitations

TradingView free accounts restrict actual publishing.

* The workflow completes **all steps up to publish**
* Publish failures are expected and logged
* The system is fully compatible with paid plans or official APIs

---

## Deliverables

* n8n workflow JSON
* End-to-end demo video (2 ideas posted sequentially)
* This technical report

---

## Final Notes

This assignment helped me deeply understand:

* How real automation systems fail
* Why defensive design matters
* How to build workflows that scale beyond demos

Instead of focusing on shortcuts, I intentionally designed this workflow to be **stable, readable, and extensible**, even as a beginner in n8n.

---

## Author

**Priyanshu Sharma**  
B.Tech Computer Science  
AI & Automation Enthusiast
