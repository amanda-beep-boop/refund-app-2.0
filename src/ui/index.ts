// The app's component library. Anything that carries a design decision (status, flags, labels,
// money, IDs, the customer, a page or card header, a disabled-action hint) comes from here;
// layout primitives (Group, Stack, Paper, Table) come from Mantine, which the theme
// (src/theme.ts) styles to match. Each file opens with what the component is for, when not to
// use it, and the rule it enforces. See the catalog in DESIGN.md.
//
// These components take props only: they never read app state. Components that do (such as
// DiscardDraftButton) live in src/components.
export { StatusBadge } from './StatusBadge';
export { Annotation, IncompleteLabel, RemitterSourceAnnotation, LumpSumAnnotation } from './Annotation';
export { Mono, Amount } from './Text';
export { FieldLabel, Field, FieldGroup } from './Field';
export { CustomerSummary } from './CustomerSummary';
export { DisabledHint } from './DisabledHint';
export { NotificationList } from './NotificationList';
export { PageHeader } from './PageHeader';
export { CardHeader } from './CardHeader';
export { LoadingNotice, TableSkeleton, EmptyState, ErrorNotice } from './States';
export { Chevron, ArrowDownIcon, LockIcon, InfoIcon, WarningIcon, MailIcon } from './Icons';
