import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'

const nlp = winkNLP(model)
const its = nlp.its

// Intent verbs (what the user is trying to do)
const SENSITIVE_ACTIONS = new Set([
  'get',
  'show',
  'reveal',
  'give'
])

// Sensitive targets
const SENSITIVE_OBJECTS = new Set([
  'token',
  'password',
  'secret'
])

function promptFromMessages(
  messages: Array<{ content?: unknown }> | undefined
): string {
  if (!Array.isArray(messages)) return ''

  return messages
    .map((m) => (typeof m?.content === 'string' ? m.content : ''))
    .join(' ')
}

// Detect if sentence is negated (simple heuristic)
function isNegated(doc: any): boolean {
  return doc.tokens().out(its.negation).some(Boolean)
}

export async function handle(
  request: { messages?: Array<{ content?: unknown }> },
  sdk: { block: (reason?: string) => unknown }
) {
  const prompt = promptFromMessages(request.messages)
  const doc = nlp.readDoc(prompt)

  // Use lemmas instead of raw tokens
  const lemmas = doc.tokens().out(its.lemma)

  const hasAction = lemmas.some((l) => SENSITIVE_ACTIONS.has(l))
  const hasObject = lemmas.some((l) => SENSITIVE_OBJECTS.has(l))
  const negated = isNegated(doc)

  // Optional: extract entities (emails, URLs, etc.)
  const entities = doc.entities().out()

  const shouldBlock = hasAction && hasObject && !negated

  if (shouldBlock) {
    return sdk.block(
      `Blocked: attempted sensitive access (entities: ${JSON.stringify(entities)})`
    )
  }

  return {
    action: 'allow',
    meta: {
      hasAction,
      hasObject,
      negated,
      entities
    },
    request
  }
}