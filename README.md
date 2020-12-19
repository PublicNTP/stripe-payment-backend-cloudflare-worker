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
$ git clone https://github.com/PublicNTP/stripe-payment-backend-cloudflare-worker.git
```

### Create new Cloudflare API token

1. Go to [API tokens](https://dash.cloudflare.com/profile/api-tokens) and click "Create Token"
1. Click "Create Custom Token"
1. Click the "Use Template" button for "Edit Cloudflare Workers"
1. Under "Account Resources," select the proper account you want to deploy the worker under
1. Under "Zone Resources," select the proper DNS zone
1. Click "Continue to summary"
1. Click "Create Token"
1. Copy the displayed token into a temporary but secure location (it will only be displayed once, so you can't retrieve it later)

### Configure Wrangler 

#### Authentication 

1. *Account ID*: Log into Cloudflare dashboard, click "Workers," and your Account ID will be displayed at the top left.

```shell
$ export CF_ACCOUNT_ID=[your CF account ID]
$ export CF_API_TOKEN=[Your API token]
```

#### Worker Name

Edit `wrangler.toml` and set the `name` field, e.g. `name = "my-example-worker"`.

#### DNS 

##### Custom Domain

If you are not deploying the worker under the `workers.dev` domain, and instead using a 
custom DNS zone managed through Cloudflare, set the Zone ID for the domain you're putting the worker in.

To get the Zone ID, from the Cloudflare dashboard, click "DNS" and pick the custom domain. The 
Zone ID will be displayed at the bottom right.

```shell
$ export CF_ZONE_ID=[your zone ID]
```

Then edit the `wrangler.toml` file to set `routes`:

1. `route`: The URL (or URL's; wildcards are accepted) for requests that Cloudflare should send your Worker for processing, 
e.g. `route = "example.com/my-worker/*"` or `my-worker.example.com/v1/payment/request`.

Create a DNS entry for the worker's host, if there isn't one already.  It can be either a CNAME or an A record. 
See [this discussion](https://community.cloudflare.com/t/setup-workers-on-personal-domain/88012) for more info, 
they recommend adding an A record for your host *that is proxied* and resolves to 192.2.0.1. 

##### Workers.dev subdomain

Create or change the `workers.dev` subdomain for this worker:

```shell
$ wrangler subdomain [subdomain name]
```

For example, `wrangler subdomain helloworld` will configure the Worker to be deployed to `https://helloworld.workers.dev`.


### Push secrets

```shell
$ wrangler secret put STRIPE_API_KEY_SECRET_TEST
(Enter Stripe API key starting with "sk_test_", found at https://dashboard.stripe.com/test/apikeys)

$ wrangler secret put STRIPE_API_KEY_SECRET_LIVE
(Enter Stripe API key starting with "sk_live_", found at https://dashboard.stripe.com/apikeys)
```


### Publish Worker

```shell
$ wrangler publish
```

Should end with:

```
Warning: webpack's output filename is being renamed to worker.js because of requirements from the Workers runtime
✨  Built successfully, built project size is 1 KiB.
✨  Successfully published your script to
 [your route] => created
 [your worker's URL]
```

### Test your payment backend in TEST mode

Run the following `curl` command to confirm your payment backend is up and running.

```shell
$ curl -d \
'{"payment_info": {"stripe_key": "test", "amount": 500, "currency": "usd", "source": "tok_visa", "description": "description text", "receipt_email": "some.person@example.com" } }' \
-H 'Content-Type: application/json' \
[your worker's route, e.g. https://payment-api.example.com/v1/payment/request]
```

### Use your payment backend in LIVE mode

Use [Stripe.js and Elements](https://stripe.com/docs/stripe-js) to create a custom form to collect payment info.

Send the following information to your payment backend:

```json
{
  "payment_info": {
    "stripe_key": "live",
    "amount": [charge amount as a positive integer in the smallest currency unit, see:
    https://stripe.com/docs/api/charges/create#create_charge-amount, but for example 12.34 USD would be "1234," as the smallest currency unit in the US is the penny, so it's 1234 pennies],
    "currency": "[three *LOWERCASE* letter ISO 4217 code for the proper currency, e.g. "usd" for the US Dollar]",
    "source": "[Stripe payment token ID from Stripe.js Element, prefixed with "tok_"]",
    "description": "[Text for description field on the emailed receipt]",
    "receipt_email": "[email address to send the charge receipt to]"
  }
}
```
