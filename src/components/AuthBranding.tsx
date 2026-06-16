import { Logo } from '@/components/Logo';

export function AuthBranding({ tagline }: { tagline: string }) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 gradient-soft">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-40 gradient-primary blur-3xl" />
      <div
        className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />
      <div className="relative z-10">
        <Logo size="lg" />
      </div>
      <div className="relative z-10 max-w-lg">
        <h2 className="text-5xl font-bold leading-tight text-gray-900">{tagline}</h2>
        <p className="mt-4 text-lg text-gray-500">
          Descubre personas afines a ti basado en intereses y personalidad.
        </p>
      </div>
      <div className="relative z-10 flex items-end gap-6 justify-center">
        <PhoneMock tilt="-8deg" delay="0s" interests={['🎵Música', '🧳Viajes']} />
        <PhoneMock tilt="6deg" delay="1.5s" featured interests={['🏀Deporte', '🎬Cine']} />
        <PhoneMock tilt="-4deg" delay="3s" interests={['📚Lectura', '💻Tecnología']} />
      </div>
    </div>
  );
}

function PhoneMock({
  tilt,
  delay,
  featured,
  interests,
}: {
  tilt: string;
  delay: string;
  featured?: boolean;
  interests: string[];
}) {
  return (
    <div
      className="animate-float rounded-[2rem] bg-white shadow-elevated border border-gray-200 p-3"
      style={{
        transform: `rotate(${tilt})`,
        animationDelay: delay,
        width: featured ? 180 : 180,
        height: featured ? 340 : 280,
      }}
    >
      <div className="h-full w-full rounded-2xl gradient-soft p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full gradient-primary" />
          <div className="flex-1">
            <div className="h-2 w-16 rounded-full bg-gray-200" />
            <div className="mt-1 h-2 w-10 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="mt-2 aspect-square rounded-xl gradient-brand opacity-80" />
        <div className="flex gap-1 flex-wrap">
          {interests.map((interest) => (
            <span
              key={interest}
              className="text-[8px] px-2 py-0.5 rounded-full bg-white shadow-subtle"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
