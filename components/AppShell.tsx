import type { NotificationStatus, RecommendationKind } from "@prisma/client";
import { resetDemoAction, saveSettingsAction, sendTelegramDigestAction, syncAtiAction } from "@/app/actions";
import type { getDashboardData } from "@/lib/db";
import { formatDate, formatMoney, formatNumber } from "@/lib/freight";
import { Badge, Button, Input, Label, Panel, PanelBody, PanelHeader, Table, Td, Th } from "@/components/ui";

type AppData = Awaited<ReturnType<typeof getDashboardData>>;

export function AppShell({ data }: { data: AppData }) {
  return (
    <div className="mx-auto max-w-[1480px] px-4 py-8 md:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-8 text-sand md:px-8">
        <div className="absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_center,rgba(215,164,75,0.28),transparent_62%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div>
            <p className="font-body text-sm uppercase tracking-[0.3em] text-sand/70">Freight MVP</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight md:text-5xl">
              Внутренняя система подбора грузов для логистов и экспедиции.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-sand/80">
              MVP объединяет ATI.SU, базу свободных машин, расчёт экономики рейса, рейтинг ставок
              и очередь Telegram-уведомлений в одной веб-панели.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neutral">Источник грузов: {data.sourceMode}</Badge>
              <Badge tone={data.auditEvents.length > 0 ? "good" : "warn"}>Audit: {data.auditEvents.length} событий</Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <form action={syncAtiAction}>
                <Button type="submit" variant="secondary">Обновить ATI демо</Button>
              </form>
              <form action={sendTelegramDigestAction}>
                <Button type="submit" variant="ghost" className="border-white/20 bg-white/5 text-sand hover:bg-white/10">Сформировать Telegram</Button>
              </form>
              <form action={resetDemoAction}>
                <Button type="submit" variant="ghost" className="border-white/20 bg-white/5 text-sand hover:bg-white/10">Сбросить демо</Button>
              </form>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Свободные машины" value={String(data.analytics.freeTruckCount)} note={`${data.analytics.truckCount} в базе`} />
            <MetricCard label="Грузы ATI" value={String(data.analytics.offerCount)} note="активные заявки" />
            <MetricCard label="Рекомендации брать" value={String(data.analytics.takeCount)} note="автоматический скоринг" />
            <MetricCard label="Средний рейтинг" value={`${data.analytics.avgScore}`} note={`макс. маржа ${formatMoney(data.analytics.bestMargin)}`} />
          </div>
        </div>
      </header>

      <main className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Дашборд</div>
                <h2 className="mt-2 font-display text-3xl text-ink">Лучшие подборки под свободные машины</h2>
              </div>
              <Badge tone="neutral">{data.topOffers.length} записей</Badge>
            </PanelHeader>
            <PanelBody className="grid gap-4">
              {data.trucks.map((truck) => (
                <article key={truck.id} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-ink">{truck.code}</h3>
                        <StatusBadge status={truck.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {truck.city} · {truck.bodyType} · {formatNumber(truck.capacityTons, 1)} т · свободна {formatDate(truck.availableFrom)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{truck.note ?? "Без комментария"}</p>
                    </div>
                    <Badge tone={truck.matches.length ? "good" : "bad"}>
                      {truck.matches.length ? `${truck.matches.length} подходящих грузов` : "Нет совпадений"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {truck.matches.slice(0, 3).map((item) => (
                      <div key={item.offer.id} className="grid gap-3 rounded-[22px] border border-white bg-white p-4 md:grid-cols-[1.3fr_0.8fr_0.7fr]">
                        <div>
                          <div className="text-lg font-semibold text-ink">
                            {item.offer.sourceCity} {"->"} {item.offer.destinationCity}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            Загрузка {formatDate(item.offer.loadDate)} · {item.offer.bodyType} · {formatNumber(item.offer.weightTons, 1)} т
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            Дистанция {formatNumber(item.economics.totalDistanceKm)} км · ATI {item.offer.atiId}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Экономика</div>
                          <div className="mt-2 text-sm text-slate-700">Ставка {formatMoney(item.offer.rateRub)}</div>
                          <div className="text-sm text-slate-700">Маржа {formatMoney(item.economics.marginRub)}</div>
                          <div className="text-sm text-slate-700">{formatMoney(item.economics.rubPerKm)}/км</div>
                        </div>
                        <div className="flex flex-col items-start gap-2">
                          <RecommendationBadge kind={item.economics.recommendation} />
                          <Badge tone="neutral">Рейтинг {item.economics.score}</Badge>
                          <div className="text-xs text-slate-500">
                            Топливо {formatMoney(item.economics.fuelRub)} · Платон {formatMoney(item.economics.platonRub)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Список грузов</div>
                <h2 className="mt-2 font-display text-3xl text-ink">Карточки заявок ATI</h2>
              </div>
              <Badge tone="neutral">Источник {data.offers[0]?.sourceSystem ?? "ATI.SU"}</Badge>
            </PanelHeader>
            <PanelBody className="overflow-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Груз</Th>
                    <Th>Параметры</Th>
                    <Th className="text-right">Ставка</Th>
                    <Th className="text-right">Км</Th>
                    <Th>Карточка груза</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.offers.map((offer) => (
                    <tr key={offer.id}>
                      <Td>
                        <div className="font-semibold text-ink">{offer.sourceCity} {"->"} {offer.destinationCity}</div>
                        <div className="mt-1 text-xs text-slate-500">ATI {offer.atiId}</div>
                      </Td>
                      <Td>
                        <div>{offer.bodyType} · {formatNumber(offer.weightTons, 1)} т</div>
                        <div className="mt-1 text-xs text-slate-500">Загрузка {formatDate(offer.loadDate)}</div>
                      </Td>
                      <Td className="text-right font-semibold text-ink">{formatMoney(offer.rateRub)}</Td>
                      <Td className="text-right">{formatNumber(offer.distanceKm)}</Td>
                      <Td className="text-sm text-slate-600">{offer.comment ?? "Без комментария"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </PanelBody>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Список машин</div>
              <h2 className="mt-2 font-display text-3xl text-ink">База автопарка</h2>
            </PanelHeader>
            <PanelBody className="space-y-4">
              {data.trucks.map((truck) => (
                <div key={truck.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">{truck.code}</div>
                      <div className="mt-1 text-sm text-slate-600">{truck.city} · {truck.bodyType} · {formatNumber(truck.capacityTons, 1)} т</div>
                      <div className="mt-1 text-sm text-slate-500">Водитель: {truck.driverName ?? "не назначен"}</div>
                    </div>
                    <StatusBadge status={truck.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Загрузка" value={formatDate(truck.availableFrom)} />
                    <MiniStat label="Матчей" value={String(truck.matches.length)} />
                    <MiniStat label="Лучшая ставка" value={truck.matches[0] ? formatMoney(truck.matches[0].offer.rateRub) : "0"} />
                  </div>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Настройки коэффициентов</div>
              <h2 className="mt-2 font-display text-3xl text-ink">Калькулятор экономики рейса</h2>
            </PanelHeader>
            <PanelBody>
              <form action={saveSettingsAction} className="grid gap-4">
                <Field label="Топливо, ₽/л" name="fuelPriceRub" defaultValue={data.settings.fuelPriceRub} />
                <Field label="Расход, л/100км" name="fuelConsumptionLiters" defaultValue={data.settings.fuelConsumptionLiters} />
                <Field label="Платон, ₽/км" name="platonRubPerKm" defaultValue={data.settings.platonRubPerKm} />
                <Field label="Водитель, ₽/км" name="driverRubPerKm" defaultValue={data.settings.driverRubPerKm} />
                <Field label="Переменные расходы, ₽/км" name="variableRubPerKm" defaultValue={data.settings.variableRubPerKm} />
                <Field label="Фикс. расходы на рейс, ₽" name="fixedTripCostsRub" defaultValue={data.settings.fixedTripCostsRub} />
                <Field label="Целевая маржа, ₽" name="targetMarginRub" defaultValue={data.settings.targetMarginRub} />
                <Field label="Маржа для торга, ₽" name="negotiateMarginRub" defaultValue={data.settings.negotiateMarginRub} />
                <Field label="Порог рейтинга брать" name="takeScoreThreshold" defaultValue={data.settings.takeScoreThreshold} />
                <Field label="Порог рейтинга торговаться" name="negotiateScoreThreshold" defaultValue={data.settings.negotiateScoreThreshold} />
                <Field label="Мин. ₽/км для брать" name="minTakeRubPerKm" defaultValue={data.settings.minTakeRubPerKm} />
                <Field label="Мин. ₽/км для торга" name="minNegotiateRubPerKm" defaultValue={data.settings.minNegotiateRubPerKm} />
                <Field label="Telegram chat id" name="telegramChatId" defaultValue={data.settings.telegramChatId ?? ""} />
                <Button type="submit" variant="secondary" className="mt-2">Сохранить коэффициенты</Button>
              </form>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Простая аналитика</div>
              <h2 className="mt-2 font-display text-3xl text-ink">Воронка решений и уведомления</h2>
            </PanelHeader>
            <PanelBody className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Брать" value={String(data.analytics.takeCount)} />
                <MiniStat label="Торговаться" value={String(data.analytics.negotiateCount)} />
                <MiniStat label="Не брать" value={String(data.analytics.declineCount)} />
                <MiniStat label="Telegram pending" value={String(data.analytics.pendingNotifications)} />
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-sm font-semibold text-ink">Последние уведомления</div>
                <div className="mt-3 space-y-3">
                  {data.notifications.length === 0 ? (
                    <div className="text-sm text-slate-500">Очередь пока пустая.</div>
                  ) : (
                    data.notifications.map((notification) => (
                      <div key={notification.id} className="rounded-[20px] border border-white bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-ink">{notification.title}</div>
                          <NotificationBadge status={notification.status} />
                        </div>
                        <div className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{notification.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="text-sm font-semibold text-ink">Аудит операций</div>
                <div className="mt-3 space-y-3">
                  {data.auditEvents.length === 0 ? (
                    <div className="text-sm text-slate-500">События пока не записаны.</div>
                  ) : (
                    data.auditEvents.map((event) => (
                      <div key={event.id} className="rounded-[20px] border border-white bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-ink">{event.action}</div>
                          <Badge tone={event.level === "ERROR" ? "bad" : event.level === "WARN" ? "warn" : "good"}>
                            {event.level.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{event.source} · {formatDate(event.createdAt)}</div>
                        <div className="mt-2 text-xs leading-5 text-slate-600">{event.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Field(props: { label: string; name: string; defaultValue: string | number }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Input name={props.name} defaultValue={String(props.defaultValue)} />
    </div>
  );
}

function MetricCard(props: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
      <div className="text-xs uppercase tracking-[0.14em] text-sand/60">{props.label}</div>
      <div className="mt-2 font-display text-4xl">{props.value}</div>
      <div className="mt-2 text-sm text-sand/70">{props.note}</div>
    </div>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white bg-white p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{props.label}</div>
      <div className="mt-2 text-sm font-semibold text-ink">{props.value}</div>
    </div>
  );
}

function RecommendationBadge(props: { kind: RecommendationKind }) {
  if (props.kind === "TAKE") return <Badge tone="good">Брать</Badge>;
  if (props.kind === "NEGOTIATE") return <Badge tone="warn">Торговаться</Badge>;
  return <Badge tone="bad">Не брать</Badge>;
}

function StatusBadge(props: { status: string }) {
  if (props.status === "FREE") return <Badge tone="good">Свободна</Badge>;
  if (props.status === "ON_ROUTE") return <Badge tone="warn">В рейсе</Badge>;
  return <Badge tone="bad">Сервис</Badge>;
}

function NotificationBadge(props: { status: NotificationStatus }) {
  return props.status === "SENT" ? <Badge tone="good">sent</Badge> : <Badge tone="warn">pending</Badge>;
}
