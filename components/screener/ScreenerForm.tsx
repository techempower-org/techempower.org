import * as React from 'react'

import type {
  AgeBandCounts,
  Answers,
  Enrollment,
  Lang,
  SituationFlag
} from '@/lib/screener/types'
import { t } from '@/lib/screener/strings'

import styles from './screener.module.css'

const ENROLLMENTS: Enrollment[] = [
  'medi-cal',
  'calfresh',
  'ssi',
  'calworks',
  'wic'
]

const AGE_BANDS: Array<{ band: keyof AgeBandCounts; labelKey: string }> = [
  { band: 'under5', labelKey: 'form.ages.under5' },
  { band: 'age5to17', labelKey: 'form.ages.age5to17' },
  { band: 'age18to59', labelKey: 'form.ages.age18to59' },
  { band: 'age60plus', labelKey: 'form.ages.age60plus' },
  { band: 'age80plus', labelKey: 'form.ages.age80plus' }
]

function clampCount(raw: string): number {
  const n = Math.floor(Number(raw))
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(12, n))
}

export function ScreenerForm({
  lang,
  onSubmit
}: {
  lang: Lang
  onSubmit: (answers: Answers) => void
}) {
  const [householdSize, setHouseholdSize] = React.useState('1')
  const [incomeAmount, setIncomeAmount] = React.useState('')
  const [incomePeriod, setIncomePeriod] = React.useState<'monthly' | 'yearly'>(
    'monthly'
  )
  const [ages, setAges] = React.useState<AgeBandCounts>({
    under5: 0,
    age5to17: 0,
    age18to59: 0,
    age60plus: 0,
    age80plus: 0
  })
  const [housing, setHousing] = React.useState<'rent' | 'own'>('rent')
  const [county, setCounty] = React.useState<'nevada' | 'other-ca'>('nevada')
  const [pge, setPge] = React.useState(false)
  const [nid, setNid] = React.useState(false)
  const [vehicle, setVehicle] = React.useState(false)
  const [failedSmog, setFailedSmog] = React.useState(false)
  const [pregnant, setPregnant] = React.useState(false)
  const [medicare, setMedicare] = React.useState(false)
  const [disability, setDisability] = React.useState(false)
  const [enrolled, setEnrolled] = React.useState<Enrollment[]>([])

  function setAgeBand(band: keyof AgeBandCounts, raw: string) {
    const n = clampCount(raw)
    setAges((prev) => {
      const next = { ...prev, [band]: n }
      // age80plus is "…of those" — clamp it inside the age60plus count
      if (band === 'age60plus' && next.age80plus > n) next.age80plus = n
      if (band === 'age80plus') next.age80plus = Math.min(n, next.age60plus)
      return next
    })
  }

  function toggleEnrolled(program: Enrollment) {
    setEnrolled((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program]
    )
  }

  function handleVehicle(checked: boolean) {
    setVehicle(checked)
    if (!checked) setFailedSmog(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const size = Math.max(
      1,
      Math.min(12, Math.floor(Number(householdSize)) || 1)
    )
    const amount = Math.max(0, Math.floor(Number(incomeAmount)) || 0)
    const flags: SituationFlag[] = [housing === 'rent' ? 'renter' : 'homeowner']
    if (pge) flags.push('pge-customer')
    if (nid) flags.push('nid-water')
    if (vehicle) flags.push('has-vehicle')
    if (vehicle && failedSmog) flags.push('failed-smog')
    if (pregnant) flags.push('pregnant')
    if (medicare) flags.push('medicare')
    if (disability) flags.push('disability')
    onSubmit({
      householdSize: size,
      incomeMonthlyGross:
        incomePeriod === 'monthly' ? amount : Math.floor(amount / 12),
      county,
      ages,
      flags,
      enrolled
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor='q-household'>
          {t(lang, 'form.householdSize')}
        </label>
        <input
          id='q-household'
          className={styles.numberInput}
          type='number'
          inputMode='numeric'
          min={1}
          max={12}
          value={householdSize}
          onChange={(e) => setHouseholdSize(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor='q-income'>
          {t(lang, 'form.income')}
        </label>
        <div className={styles.incomeRow}>
          <input
            id='q-income'
            className={styles.numberInput}
            type='number'
            inputMode='decimal'
            min={0}
            step={1}
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            required
          />
          <div
            className={styles.radioRow}
            role='radiogroup'
            aria-label={t(lang, 'form.income')}
          >
            <span className={styles.choice}>
              <input
                id='q-income-monthly'
                className={styles.radio}
                type='radio'
                name='income-period'
                checked={incomePeriod === 'monthly'}
                onChange={() => setIncomePeriod('monthly')}
              />
              <label className={styles.choiceLabel} htmlFor='q-income-monthly'>
                {t(lang, 'form.income.monthly')}
              </label>
            </span>
            <span className={styles.choice}>
              <input
                id='q-income-yearly'
                className={styles.radio}
                type='radio'
                name='income-period'
                checked={incomePeriod === 'yearly'}
                onChange={() => setIncomePeriod('yearly')}
              />
              <label className={styles.choiceLabel} htmlFor='q-income-yearly'>
                {t(lang, 'form.income.yearly')}
              </label>
            </span>
          </div>
        </div>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t(lang, 'form.ages')}</legend>
        <div className={styles.agesGrid}>
          {AGE_BANDS.map(({ band, labelKey }) => (
            <div className={styles.ageField} key={band}>
              <label className={styles.choiceLabel} htmlFor={`q-age-${band}`}>
                {t(lang, labelKey)}
              </label>
              <input
                id={`q-age-${band}`}
                className={styles.numberInput}
                type='number'
                inputMode='numeric'
                min={0}
                max={band === 'age80plus' ? ages.age60plus : 12}
                value={ages[band]}
                onChange={(e) => setAgeBand(band, e.target.value)}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t(lang, 'form.housing')}</legend>
        <div className={styles.radioRow}>
          <span className={styles.choice}>
            <input
              id='q-housing-rent'
              className={styles.radio}
              type='radio'
              name='housing'
              checked={housing === 'rent'}
              onChange={() => setHousing('rent')}
            />
            <label className={styles.choiceLabel} htmlFor='q-housing-rent'>
              {t(lang, 'form.housing.rent')}
            </label>
          </span>
          <span className={styles.choice}>
            <input
              id='q-housing-own'
              className={styles.radio}
              type='radio'
              name='housing'
              checked={housing === 'own'}
              onChange={() => setHousing('own')}
            />
            <label className={styles.choiceLabel} htmlFor='q-housing-own'>
              {t(lang, 'form.housing.own')}
            </label>
          </span>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t(lang, 'form.county')}</legend>
        <div className={styles.radioRow}>
          <span className={styles.choice}>
            <input
              id='q-county-nevada'
              className={styles.radio}
              type='radio'
              name='county'
              checked={county === 'nevada'}
              onChange={() => setCounty('nevada')}
            />
            <label className={styles.choiceLabel} htmlFor='q-county-nevada'>
              {t(lang, 'form.county.nevada')}
            </label>
          </span>
          <span className={styles.choice}>
            <input
              id='q-county-other'
              className={styles.radio}
              type='radio'
              name='county'
              checked={county === 'other-ca'}
              onChange={() => setCounty('other-ca')}
            />
            <label className={styles.choiceLabel} htmlFor='q-county-other'>
              {t(lang, 'form.county.other')}
            </label>
          </span>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t(lang, 'form.flags')}</legend>
        <div className={styles.checkList}>
          <div className={styles.checkItem}>
            <input
              id='q-flag-pge'
              className={styles.checkbox}
              type='checkbox'
              checked={pge}
              onChange={(e) => setPge(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-pge'>
              {t(lang, 'form.flags.pge')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-nid'
              className={styles.checkbox}
              type='checkbox'
              checked={nid}
              onChange={(e) => setNid(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-nid'>
              {t(lang, 'form.flags.nid')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-vehicle'
              className={styles.checkbox}
              type='checkbox'
              checked={vehicle}
              onChange={(e) => handleVehicle(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-vehicle'>
              {t(lang, 'form.flags.vehicle')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-smog'
              className={styles.checkbox}
              type='checkbox'
              checked={failedSmog}
              disabled={!vehicle}
              onChange={(e) => setFailedSmog(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-smog'>
              {t(lang, 'form.flags.failedSmog')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-pregnant'
              className={styles.checkbox}
              type='checkbox'
              checked={pregnant}
              onChange={(e) => setPregnant(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-pregnant'>
              {t(lang, 'form.flags.pregnant')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-medicare'
              className={styles.checkbox}
              type='checkbox'
              checked={medicare}
              onChange={(e) => setMedicare(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-medicare'>
              {t(lang, 'form.flags.medicare')}
            </label>
          </div>
          <div className={styles.checkItem}>
            <input
              id='q-flag-disability'
              className={styles.checkbox}
              type='checkbox'
              checked={disability}
              onChange={(e) => setDisability(e.target.checked)}
            />
            <label className={styles.choiceLabel} htmlFor='q-flag-disability'>
              {t(lang, 'form.flags.disability')}
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t(lang, 'form.enrolled')}</legend>
        <div className={styles.checkList}>
          {ENROLLMENTS.map((program) => (
            <div className={styles.checkItem} key={program}>
              <input
                id={`q-enrolled-${program}`}
                className={styles.checkbox}
                type='checkbox'
                checked={enrolled.includes(program)}
                onChange={() => toggleEnrolled(program)}
              />
              <label
                className={styles.choiceLabel}
                htmlFor={`q-enrolled-${program}`}
              >
                {t(lang, `form.enrolled.${program}`)}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <button className={styles.submit} type='submit'>
        {t(lang, 'form.submit')}
      </button>
    </form>
  )
}
