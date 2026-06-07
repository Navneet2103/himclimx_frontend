import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 30;

function buildPrompt(
  data: any,
  variable: any,
  region: any,
  startYear: number,
  endYear: number
): string {
  const lines: string[] = [
    `Generate a comprehensive climate analysis report for the following dataset:`,
    `Variable: ${variable?.name ?? 'Unknown'} (${variable?.unit ?? ''})`,
    `Region: ${region?.name ?? 'Unknown'} — ${region?.climateZone ?? ''}, elevation ${region?.range ?? ''}`,
    `Analysis period: ${startYear}–${endYear}`,
    '',
  ];

  if (data.statistics) {
    const s = data.statistics;
    lines.push(
      `STATISTICS: mean=${s.mean?.toFixed(3)} ${variable?.unit}, ` +
      `min=${s.min?.toFixed(3)}, max=${s.max?.toFixed(3)}, std=${s.std?.toFixed(4)}, n=${s.count}`
    );
  }

  if (data.trend) {
    const t = data.trend;
    const p = t.p_value < 0.001 ? '<0.001' : t.p_value?.toFixed(4);
    lines.push(
      `TREND (OLS on annual means): slope=${t.per_decade?.toFixed(5)} ${variable?.unit}/decade, ` +
      `R²=${t.r_squared?.toFixed(4)}, p=${p}, percent_change=${t.percent_change?.toFixed(2)}%`
    );
    if (t.sens_per_decade !== undefined) {
      lines.push(`TREND (Sen's slope): ${t.sens_per_decade?.toFixed(5)} ${variable?.unit}/decade`);
    }
    if (t.mann_kendall) {
      const mk = t.mann_kendall;
      const mkp = mk.p_value < 0.001 ? '<0.001' : mk.p_value?.toFixed(4);
      lines.push(`MANN-KENDALL: ${mk.trend}, τ=${mk.tau?.toFixed(4)}, p=${mkp}`);
    }
  }

  if (data.anomalies) {
    const a = data.anomalies;
    const total = a.years?.length ?? 0;
    const count = a.anomalies?.length ?? 0;
    lines.push(`ANOMALIES: ${count} detected in ${total} years (z > ${a.threshold})`);
    if (count > 0) {
      const notable = a.anomalies
        .slice(0, 6)
        .map((x: any) => `${x.year} (${x.type}, z=${x.z_score?.toFixed(2)})`)
        .join(', ');
      lines.push(`Notable years: ${notable}`);
    }
  }

  if (data.forecast) {
    const f = data.forecast;
    const last = f.values?.at(-1);
    lines.push(
      `FORECAST (${f.method ?? 'ETS'}, 5-year): direction=${f.trend}, ` +
      `change_rate=${f.change_rate?.toFixed(2)}%, projected end value=${last?.toFixed(3)} ${variable?.unit}`
    );
  }

  if (data.scenarios) {
    const sc = data.scenarios;
    lines.push(
      `SCENARIOS (2050 projection, baseline=${sc.baseline?.toFixed(3)} ${variable?.unit}): ` +
      `SSP1-2.6: ${sc.ssp1?.future_value?.toFixed(3)} (${sc.ssp1?.percent_change?.toFixed(1)}%), ` +
      `SSP2-4.5: ${sc.ssp2?.future_value?.toFixed(3)} (${sc.ssp2?.percent_change?.toFixed(1)}%), ` +
      `SSP3-7.0: ${sc.ssp3?.future_value?.toFixed(3)} (${sc.ssp3?.percent_change?.toFixed(1)}%), ` +
      `SSP5-8.5: ${sc.ssp5?.future_value?.toFixed(3)} (${sc.ssp5?.percent_change?.toFixed(1)}%)`
    );
  }

  if (data.impact) {
    const i = data.impact;
    lines.push(
      `IMPACT ASSESSMENT: ${i.risk_level?.toUpperCase()} risk (score ${i.risk_score}/10)`
    );
    if (i.impact_areas?.length) {
      lines.push(`Impact areas: ${i.impact_areas.join(', ')}`);
    }
    if (i.sector_vulnerability) {
      const sv = Object.entries(i.sector_vulnerability as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `${k.replace('_', ' ')}: ${v}/10`)
        .join(', ');
      lines.push(`Sector vulnerability: ${sv}`);
    }
  }

  lines.push('');
  lines.push(
    `Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "title": "descriptive report title",
  "executive_summary": "2-3 sentence high-level overview of findings",
  "key_findings": [
    "finding 1 with specific numbers",
    "finding 2 with specific numbers",
    "finding 3 with specific numbers",
    "finding 4 with specific numbers",
    "finding 5 with specific numbers"
  ],
  "observed_climate": "2-3 sentences about the current climate state and historical context",
  "trend_analysis": "3-4 sentences about trend direction, magnitude, statistical significance, and comparison to regional/global averages",
  "forecast_outlook": "2-3 sentences about near-term projections and confidence",
  "scenario_analysis": "2-3 sentences comparing SSP pathways and their implications for this variable and region",
  "impact_assessment": "2-3 sentences about risk levels, vulnerable sectors, and downstream effects",
  "recommendations": [
    "specific, actionable recommendation 1",
    "specific, actionable recommendation 2",
    "specific, actionable recommendation 3",
    "specific, actionable recommendation 4"
  ],
  "data_quality_note": "1-2 sentences about CRU data reliability and limitations",
  "methodology_note": "1-2 sentences about methods: OLS + Sen slope trend, Mann-Kendall test, Holt-Winters ETS forecast",
  "conclusion": "2-3 sentence synthesising statement"
}`
  );

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, variable, region, startYear, endYear } = body;

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'Report generation is not configured. Contact the administrator.' },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey: key });
    const prompt = buildPrompt(data, variable, region, startYear, endYear);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior climate scientist specialising in Himalayan climatology. ' +
            'Write professional, data-driven reports using scientific language that is also accessible to policymakers. ' +
            'Always cite specific numbers from the provided data. ' +
            'Respond with valid JSON only — no markdown, no code fences, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2800,
      temperature: 0.4,
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const report = JSON.parse(raw);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Report generation error:', error);
    const message =
      error?.error?.message ?? error?.message ?? 'Report generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
