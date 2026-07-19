export default function FanVoteReveal({ userVote, fanYesPct, fanAgreementPct, agreedWithMajority }) {
  const userLabel = userVote ? 'YES' : 'NO'
  const userColor = userVote ? 'text-accent-green' : 'text-accent-red'

  return (
    <section
      className="animate-fade-up text-center bg-pitch-800 border border-pitch-600 rounded-2xl p-8"
      aria-labelledby="fan-vote-heading"
      data-gravity
    >
      <p id="fan-vote-heading" className="text-gray-400 text-sm uppercase tracking-widest mb-4">
        Your call vs the crowd
      </p>
      <p className="text-2xl font-bold mb-1">
        You voted: <span className={userColor}>{userLabel}</span>
      </p>
      <p className="text-xl text-white mb-6">
        <span className="text-accent-gold font-bold">{fanAgreementPct}%</span> of fans agreed with
        you
      </p>
      <div className="flex justify-between text-sm mb-2 px-1">
        <span className="text-accent-green font-semibold">YES {fanYesPct}%</span>
        <span className="text-accent-red font-semibold">NO {100 - fanYesPct}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex bg-pitch-700">
        <div
          className="bg-accent-green transition-all duration-1000 ease-out"
          style={{ width: `${fanYesPct}%` }}
        />
        <div
          className="bg-accent-red transition-all duration-1000 ease-out"
          style={{ width: `${100 - fanYesPct}%` }}
        />
      </div>
      <p className={`text-sm mt-4 ${agreedWithMajority ? 'text-accent-green' : 'text-accent-gold'}`}>
        {agreedWithMajority
          ? 'You sided with the majority.'
          : 'You went against the majority — just like millions of fans do.'}
      </p>
    </section>
  )
}
