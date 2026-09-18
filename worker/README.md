# Сервер (Cloudflare Worker)

Адрес: https://forerkort-trener.velltman.workers.dev

Что делает: регистрация по имени, PIN и коду приглашения; хранение прогресса; таблица круга друзей; прокси к Claude API для «Учителя», доступный только владельцу (первый зарегистрированный) и именам из списка разрешённых.

## Команды (из папки worker/)

```bash
npx wrangler deploy                          # выложить изменения кода
npx wrangler secret put INVITE_CODE          # сменить код приглашения
npx wrangler secret put ANTHROPIC_API_KEY    # задать ключ учителя (вводится скрытно)
npx wrangler kv key list --binding USERS --remote   # посмотреть, кто зарегистрирован
```

Разрешить учителя ещё кому-то (от аккаунта владельца, в консоли браузера на сайте):

```js
Cloud.setTeacherAllowed(["Имя друга"])
```
