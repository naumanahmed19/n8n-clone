interface CredentialsHeaderProps {
  credentialsCount: number
}

export function CredentialsHeader({ credentialsCount }: CredentialsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Credentials ({credentialsCount})
      </span>
    </div>
  )
}