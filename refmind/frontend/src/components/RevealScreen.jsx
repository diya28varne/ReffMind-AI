import AskTheRef from './AskTheRef'
import TransparencyNote from './TransparencyNote'
import CameraMissedCard from './CameraMissedCard'
import ChangeDecisionPrompt from './ChangeDecisionPrompt'
import DebateMode from './DebateMode'
import EmotionRuleMeter from './EmotionRuleMeter'
import FanVoteReveal from './FanVoteReveal'
import FinalVerdict from './FinalVerdict'
import GeminiToolsPanel from './GeminiToolsPanel'
import GuardianAudit from './GuardianAudit'
import IfabPageProof from './IfabPageProof'
import PerspectiveSwitch from './PerspectiveSwitch'
import PressureOnReferee from './PressureOnReferee'
import RefTrustScore from './RefTrustScore'
import WhyArgumentsLast from './WhyArgumentsLast'
import WhyFansDisagree from './WhyFansDisagree'

function buildSpeakTexts(result) {
  const ref = result.referee_context || {}
  const fansItems = result.why_fans_disagree_bullets?.length
    ? result.why_fans_disagree_bullets
    : result.why_fans_disagree
      ? [result.why_fans_disagree]
      : []

  return {
    fan: `${result.description}. ${(result.why_fans_disagree_bullets || []).join('. ')}`,
    rule: `${result.rule_citation || 'IFAB rule'}. ${result.rule_explanation}`,
    referee: `${result.referee_perspective} Position: ${ref.referee_position}. Angle: ${ref.view_angle}. Decision time: ${ref.decision_time_seconds} seconds.`,
    camera: (result.camera_missed_bullets || [result.camera_analysis]).filter(Boolean).join('. '),
    fansDisagree: fansItems.join('. '),
    verdict: `Final verdict: ${result.verdict}. ${result.verdict_reasoning}. AI confidence ${result.confidence_pct} percent.`,
  }
}

export default function RevealScreen({ result, onNext, onRestart, hasNext, onTrustUpdate }) {
  const fanAgreementPct =
    result.fan_agreement_pct ??
    (result.user_vote ? result.fan_yes_pct : result.fan_no_pct)

  const speak = buildSpeakTexts(result)

  return (
    <div className="space-y-5">
      <FanVoteReveal
        userVote={result.user_vote}
        fanYesPct={result.fan_yes_pct}
        fanAgreementPct={fanAgreementPct}
        agreedWithMajority={result.agreed_with_majority}
      />

      <WhyArgumentsLast anatomy={result.argument_anatomy} />

      <IfabPageProof proof={result.rule_proof} />

      <PerspectiveSwitch result={result} speakTexts={speak} />

      <EmotionRuleMeter emotionRule={result.emotion_rule} />

      <PressureOnReferee
        pressure={result.pressure_context}
        refereeContext={result.referee_context}
      />

      <CameraMissedCard
        bullets={result.camera_missed_bullets}
        narrative={result.camera_analysis}
        speakText={speak.camera}
        ogScene={result.og_scene}
      />

      <WhyFansDisagree
        bullets={result.why_fans_disagree_bullets}
        narrative={result.why_fans_disagree}
        speakText={speak.fansDisagree}
      />

      <DebateMode splitVerdict={result.split_verdict} />

      <ChangeDecisionPrompt
        incidentId={result.incident_id}
        originalVote={result.user_vote}
      />

      <RefTrustScore incidentId={result.incident_id} onRated={onTrustUpdate} />

      <FinalVerdict
        verdict={result.verdict}
        confidence={result.confidence}
        confidencePct={result.confidence_pct}
        reasoning={result.verdict_reasoning}
        speakText={speak.verdict}
      />

      <GuardianAudit audit={result.guardian_audit} />

      <GeminiToolsPanel tools={result.gemini_tools} />

      <AskTheRef incidentId={result.incident_id} analysisContext={result} />

      {result.demo_mode && (
        <p className="text-center text-xs text-gray-500">
          Demo mode — add Watsonx credentials for live Granite analysis
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl border border-pitch-600 text-gray-300 hover:bg-pitch-800 transition-colors"
        >
          Replay this incident
        </button>
        {hasNext && (
          <button
            onClick={onNext}
            className="flex-1 py-3 rounded-xl bg-accent-gold text-pitch-900 font-semibold hover:bg-yellow-400 transition-colors"
          >
            Next incident →
          </button>
        )}
      </div>

      <TransparencyNote className="mt-6" />
    </div>
  )
}
