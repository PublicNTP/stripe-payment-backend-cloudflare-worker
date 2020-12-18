# stripe-payment-backend-cloudflare-worker

Payment backend for Stripe donations using Cloudflare Workers.

# Installation

## Ubuntu 20.04

### NPM

Need a newer version of `npm` to install Wrangler than the dated one that Ubuntu 20.04 ships with (weirdly).

Use [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04).

Use the "nvm" installation method.

Install the latest LTS version of Node (v14 as of this writing).

### Wrangler

```shell
$ npm i @cloudflare/wrangler -g
```

Instructions found [here](https://developers.cloudflare.com/workers/cli-wrangler/install-update).

### Repository as Template

*NOTE*: needs update to reflect using our template that's based on THIS template.

```shell
$ wrangler generate pntp-payment-backend-cloudflare https://github.com/EverlastingBugstopper/worker-typescript-template
```

### Set environment variables for your account

```shell
$ export CF_ACCOUNT_ID=[your CF account ID]
$ export CF_API_TOKEN=[Your API token]
$ export CF_ZONE_ID=[your zone ID]
```

### Push secrets

```shell
$ wrangler secret put STRIPE_API_KEY_SECRET_TEST
(Enter Stripe API key starting with "sk_test_", found at https://dashboard.stripe.com/test/apikeys)

$ wrangler secret put STRIPE_API_KEY_SECRET_LIVE
(Enter Stripe API key starting with "sk_live_", found at https://dashboard.stripe.com/apikeys)
```
