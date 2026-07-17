# Research Methodology Toolkit

> The "theoretically and technically sound" core. Use to design studies and to
> defend the rigor of any analysis.

## 1. Choosing a method

| Business question type | Recommended approach |
|---|---|
| "How big is the market / opportunity?" | Secondary research + market sizing model (TAM/SAM/SOM) |
| "Will people participate / pay?" | Quantitative survey + willingness-to-pay (Van Westendorp, Gabor-Granger, conjoint) |
| "Why do people behave this way?" | Qualitative — in-depth interviews, focus groups, ethnography |
| "Which scheme design performs best?" | Experiment / pilot + comparative analysis |
| "What will the return rate be?" | Forecasting model (regression on deposit value, density, maturity) |
| "Who are the customer/stakeholder segments?" | Segmentation (cluster/factor analysis) |

Prefer **mixed methods**: qual to explore & frame, quant to measure & generalize.

## 2. Research design

- **Objectives → hypotheses → variables → method → analysis plan.** Write the
  analysis plan *before* collecting data.
- **Validity**: internal (causal claims sound?), external (generalizable?),
  construct (are you measuring what you think?).
- **Reliability**: consistent, repeatable measurement.

## 3. Sampling

- **Probability** (random, stratified, cluster, systematic) → generalizable, enables
  inference. Preferred when representativeness matters.
- **Non-probability** (convenience, quota, purposive, snowball) → faster/cheaper,
  limited generalizability. Note the bias.
- **Sample size**: driven by margin of error, confidence level, population variance,
  and expected effect size. For proportions, n ≈ (Z²·p·(1-p)) / e². State assumptions.
- **Stratify** by the variables that matter (region, urban/rural, container type,
  demographic) so subgroups are analyzable.

## 4. Questionnaire / instrument design

- One idea per question; avoid double-barreled, leading, loaded items.
- Match scale to intent: nominal, ordinal, interval (Likert), ratio.
- Include screeners, control/attention checks, and demographics.
- Pilot-test before full fielding.
- For pricing: **Van Westendorp** (price sensitivity), **Gabor-Granger** (demand at
  price points), **conjoint** (trade-offs across attributes like deposit value,
  convenience, container type).

## 5. Bias control

Selection, non-response, social-desirability, order/anchoring, confirmation,
survivorship, recall bias. Mitigate via randomization, neutral wording, anonymity,
representative sampling, and pre-registered analysis.

## 6. Analytical techniques

- **Descriptive**: central tendency, dispersion, distribution, cross-tabs.
- **Inferential**: hypothesis tests (t-test, chi-square, ANOVA), confidence
  intervals, p-values — always report effect size, not just significance.
- **Regression**: linear (continuous outcome, e.g. return rate), logistic (binary,
  e.g. return / not), multiple regression for drivers.
- **Multivariate**: cluster (segmentation), factor/PCA (dimension reduction),
  conjoint (preference), discriminant analysis.
- **Forecasting**: trend/time-series, scenario modeling, elasticity estimates.
- **Always** state: method, assumptions, sample, confidence, and limitations.

## 7. Quality checklist before publishing

- [ ] Business question explicitly answered
- [ ] Method fits the question
- [ ] Sample adequate & bias acknowledged
- [ ] Statistics correct; effect sizes reported
- [ ] Fact vs estimate vs opinion clearly separated
- [ ] Limitations & data gaps stated
- [ ] Recommendations tied to the evidence
