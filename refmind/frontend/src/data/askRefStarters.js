export const DEFAULT_ASK_REF_STARTERS = [
  'Was the referee correct?',
  'Why do fans disagree?',
  'Which rule applies?',
  'What did the camera miss?',
]

export const ASK_REF_STARTERS = {
  'wc2022-montiel-handball': [
    'Was Montiel\'s arm in an unnatural position?',
    'Did the ball move toward his arm?',
    'Why is this handball borderline under Law 12?',
    'What did the referee see in the box scramble?',
    'Could the arm have been natural when Molina cleared?',
    'Why do fans split on this World Cup final call?',
  ],
  'wc2010-suarez-handball': [
    'Was the red card mandatory here?',
    'Did Suárez deny an obvious goal?',
    'Is this gamesmanship or cheating?',
    'Why was the missed penalty not the ref\'s fault?',
    'What did the referee see on the goal line?',
    'Why do most fans say the call was correct?',
  ],
  'euro2020-england-penalty': [
    'Was there enough contact for a penalty?',
    'Did Sterling dive or was he tripped?',
    'Why wasn\'t VAR used on the foul itself?',
    'What did the trailing angle hide?',
    'Did the laser pointer affect the decision?',
    'Why is this so divisive among fans?',
  ],
  'wc2022-saudi-offside': [
    'Was Lautaro\'s shoulder offside?',
    'How does semi-automated VAR work here?',
    'Could the wrong defender line be used?',
    'Why can\'t fans see this live in the stadium?',
    'Was the flag staying down correct at first?',
    'Why is a pixel-thin margin so controversial?',
  ],
  'ucl-2019-llorente-handball': [
    'Did the ball hit Llorente\'s arm or chest?',
    'Should Moura\'s goal have been disallowed?',
    'Why was there no VAR in Europe that season?',
    'What did the side-on angle hide at speed?',
    'Did the arm create the goal-scoring chance?',
    'What did TV see that the ref could not?',
  ],
}

export function getAskRefStarters(incidentId) {
  return ASK_REF_STARTERS[incidentId] ?? DEFAULT_ASK_REF_STARTERS
}
