import { useTranslations } from "next-intl";

/**
 * The editorial greeting beside the sign-in form.
 * @returns The welcome headline and supporting line.
 */
export function SignInWelcome() {
  const translate = useTranslations("access.signIn.welcome");

  return (
    <div>
      <h1 className="font-display text-5xl leading-display font-bold tracking-display text-balance md:text-7xl">
        {translate.rich("title", {
          br: () => <br />,
          em: (chunks) => <em className="text-orange-deep">{chunks}</em>,
        })}
      </h1>
      <p className="mt-4.5 max-w-prose text-sm text-muted-foreground sm:mt-6 md:text-base">
        {translate.rich("body", { br: () => <br /> })}
      </p>
    </div>
  );
}
