# FixItPro Partner Portal — Production-Ready Implementation

Dedicated on-demand service professional portal for the FixItPro platform, built with **React 19**, **Vite**, **Tailwind CSS**, and **Lucide Icons**. Runs on **port 5175**.

---

## 🚀 Key Highlights & Architecture

1. **Mandatory Authoritative Security Deposit (Part 2 & Part 4)**
   - **Individual Partner**: ₹5,000 INR
   - **Organization**: ₹10,000 INR
   - Authoritative backend policy enforcement — client cannot modify or bypass amounts.
   - Separate escrow ledger: Funds are strictly separated from customer service fees and platform commissions.
   - Status state machine: `NOT_STARTED` → `PAYMENT_PENDING` → `VERIFICATION_PENDING` → `VERIFIED` → `REFUND_PENDING` → `REFUNDED`.

2. **Onboarding-Aware Smart Routing (Part 3)**
   - State-based routing prevents unauthorized dashboard access:
     - Deposit unpaid → Redirected to Security Deposit Screen
     - Deposit pending → Redirected to Deposit Status Screen
     - Documents incomplete → Redirected to Document Submission
     - Documents rejected → Redirected to Document Resubmission with rejection reason
     - Suspended → Redirected to Restricted Account Screen
     - Fully eligible → Redirected to Partner Dashboard

3. **Uber Partner-Style Live Request Alerting (Part 8)**
   - High-priority incoming alert card & full-screen overlay.
   - Real **Web Audio API** harmonic synthesizer for melodic incoming alert chimes (no external audio files needed).
   - Mobile **Vibration API** (`navigator.vibrate`) for device haptics on supported mobile devices.
   - Real-time 45-second circular countdown based on server expiry timestamp.
   - Concurrency safety: Atomic acceptance claims the job and invalidates competing offers.

4. **Independent Replacement Product Workflow (Part 10)**
   - FixItPro does **not** participate in replacement product sales or markups.
   - Customer may purchase required parts:
     1. Independently from an outside market
     2. Directly from the partner
   - Part availability tracker: `Product Identified` → `Awaiting Customer Purchase` → `Customer Reports Purchased` → `Product Available` → `Ready to Resume`.
   - Service can be paused while awaiting parts and resumed.

5. **Fixed Category Pricing (Part 9)**
   - Category fees are fixed by Admin (Custom Carpentry ₹499, Plumbing ₹399, Electrical ₹349, AC Service ₹599).
   - Partners cannot inflate prices or add arbitrary labor charges.
   - Inclusions and exclusions clearly displayed for both customer and partner.

6. **INR Financial Ledger & 80% Net Payouts (Part 12)**
   - Flat 20% platform cut; **80% net credited directly to partner**.
   - Decimal-safe INR financial calculations with `₹` currency symbols and Indian number formatting (`₹5,000`, `₹10,000`).
   - Payout channels: UPI Direct & Bank NEFT with Penny-Drop verification simulation.

7. **Floating Admin & Dispatch Testing Suite**
   - Floating drawer button allowing testers to immediately trigger live Uber-style job offers, verify deposits, approve/reject documents with reasons, and toggle account suspensions.

8. **Automated E2E Test Suite (Part 18)**
   - Includes 8 comprehensive test cases executable both in-app and via CLI (`node test_partner_app.js`).

---

## 🛠️ How to Run & Test

### 1. Start Partner Development Server
```powershell
cd ApexServices\Frontend\partner
npm run dev
```
*Access URL: http://localhost:5175/*

### 2. Run Automated Verification Test Suite
```powershell
cd ApexServices\Frontend\partner
node test_partner_app.js
```

### 3. Build Production Bundle
```powershell
cd ApexServices\Frontend\partner
npm run build
```
