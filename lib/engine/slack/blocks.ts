/** Block Kit builders for the two-way Slack messages. */

/** Approval message: [✅ Approve] [✗ Skip]. The buttons carry the pending-action
 *  id as their value, which the interactions endpoint uses to resolve the role. */
export function approvalBlocks(opts: {
  company: string
  title: string
  fit: number | null
  pendingId: number
}): unknown[] {
  const fitTxt = opts.fit != null ? ` · fit ${opts.fit}` : ''
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Ready to apply:* ${opts.company} — ${opts.title}${fitTxt}\nBorderline fit — approve to submit, or skip.`,
      },
    },
    {
      type: 'actions',
      block_id: `approve_${opts.pendingId}`,
      elements: [
        {
          type: 'button',
          style: 'primary',
          text: { type: 'plain_text', text: '✅ Approve' },
          action_id: 'approve_apply',
          value: String(opts.pendingId),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '✗ Skip' },
          action_id: 'skip_apply',
          value: String(opts.pendingId),
        },
      ],
    },
  ]
}

/** Question prompt: asks Matthew to reply in-channel with an answer. */
export function questionText(opts: { company: string; title: string; question: string }): string {
  return [
    `*${opts.company} — ${opts.title}* needs an answer before I can submit:`,
    `> ${opts.question}`,
    `_Reply in this channel with your answer and I'll fill it in and submit._`,
  ].join('\n')
}
