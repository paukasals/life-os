"""
Lobsteria — Post responses to all 142 unanswered Google reviews
Run with: python3 gbp_respond.py --dry-run   (preview only)
Run with: python3 gbp_respond.py --post       (actually post)
"""

import json, sys, time, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

TOKEN_FILE  = "/Users/paucasals/.claude/gbp_token.json"
ACCOUNT_ID  = "accounts/116034753039907650025"
LOCATION_ID = "locations/597904207241812621"
REVIEWS_FILE = "/Users/paucasals/lobsteria/gbp_reviews_data.json"
SCOPES = ["https://www.googleapis.com/auth/business.manage"]

# ─────────────────────────────────────────────
# PERSONALIZED RESPONSES — reviews with text
# ─────────────────────────────────────────────
CUSTOM = {
    # 5-star with text — personalized
    "AbFvOqnZs8zZYQthTju61LwqUFTcc9hC3V3QHBtiGh_h96Mcy4lNzn3jtZxyKGxZDFZzxe4e6Az6aw":
        "Arghavan, this made our night. The warm roll + ceviche combo is exactly what we're here for — handmade, no shortcuts. The medium spice hit is real! Thank you for describing it so perfectly. Come back soon 🦞",

    "AbFvOqnnFVywUlVKKx0ccZMjGfThFMdspmT4xH8qD8VMcyvRgpQfggrpavCd6mULdw4eaR_UK9HT3g":
        "Arturo — worth every penny is exactly what we aim for. Fresh lobster, made to order, every time. Thank you! 🦞",


    "AbFvOqnT1cqgE3HlIo0QqzU8a8a9QVHlGoGNZMRWQDkhWl6-8X1YUqhZwdFeagDFttyjS6YvPHwe":
        "Best ceviches in Wynwood — we'll take it! Fresh corvina, real leche de tigre. Thank you Kevin! 🦞",

    "AbFvOqmPXuFBw5Ul1wrs8nrpDXauj_95OljlFSxJZviKUOIE6ljl1C3PX5kP_EP-6541lf8UQIG9":
        "¡Gracias, Levin! La langosta, las ostras y el ceviche — el combo completo. Vuelve cuando quieras 🦞",

    "AbFvOqkTxx4NU1o7zP7sBrFpHJKRFgISQjkOtdxNmxjShRsTZPJJjcL5w5v9EcGjEb6JdK9nMaqqSQ":
        "¡Ana Isa, muchas gracias! El lobster roll es una experiencia que no se olvida. ¡Te esperamos pronto! 🦞",

    "AbFvOqnP5jy4lvphgq8B_PfSVZUFdHXpO6TFce3da8CstiNuWuphftqVDgEzYLaSpJlhnDV3t8cihw":
        "Ceviche, oysters AND the lobster roll — the full Lobsteria spread. Thank you! See you next time 🦞",


    "AbFvOqnyR05EcfgoNgPKTdWvlvYOVkWXwMmIpW0CpglJuDe2FBHsm8OdcVxuSJZZHLOIy16MVJmSqg":
        "Best in Miami — that's our goal every single night. Thank you Jessica! 🦞",

    "AbFvOqmPN0t3lEGhsQqrtcS6w1VMTAYn1Sbxv428IrMon6LVIue8iorci5FoXL0Tx4ra-_iKf10yQA":
        "High quality food at a real price — exactly what we built this for. Thank you Tasha! 🦞",

    "AbFvOqmRUCdkgYeyp6a7mVOXWhRSb4Dcmb2ujRYBgXGo2DO0CNnYtXSS7qPd6BtpSmZjsmmW9byQ-A":
        "Best oysters AND lobster roll — you nailed the order, Joel. The vibe + the food = what Wynwood was made for. Come back! 🦞",

    "AbFvOqm90aud0aux8fEHL5vgWjQFIszigG7EMbUfrEcyrfAL1NlRblKCqOegB3P3_rmAyT4Ox4J9VA":
        "Best lobster roll in Miami — we take that seriously. Thank you Franklyn! 🦞",

    "AbFvOqnpEXC_-Lu744Pd8r4ZSasKn_iUA79n44R9iA6GyDo5HPH2Y08K-jIe0aGP9P9ukZvjooZLlQ":
        "¡Pescado fresco, langosta de otro mundo — eso es Lobsteria! Gracias, vuelve pronto 🦞",

    "AbFvOql7H0AmDfyz_QEX8e6xzEh4DfP1rcpV7zoAWRXyvt5OH13xZISgriYeK3LEaRz0gaxQZhrtZA":
        "Thank you! Having the owner cook right in front of you — that’s Lobsteria every night. 谢谢你， come back anytime 🦞",

    "AbFvOqkfF5-BFYdt4wv7yCP8iGQQYJSZOJQVt4fdIAzOi2NlYdx5eSy9ROvUge0MyArJbgxrZOkbiw":
        "¡Maine lobster súper delicioso — Álvaro, eso es exactamente lo que queremos escuchar! Vuelve pronto 🦞",

    "AbFvOqls1QqNuHCHy669BMZq5rNEpDm9NrOWrl4yRU4uy9k2BpOMsGYTHVIERxmpN1GRp0EcosZ8Ig":
        "Kevin, fresh is the only way we do it. Come back when you're in town — we're here every night until 2am 🦞",

    "AbFvOqkwoWl8xcyaG8ocMX4_qcX86VYZtAzAUAYdSR0xMUhcUi1ABFwCHTYeGPs5P8FMBoOuwoLP":
        "Lobster rolls + ceviches + Rockefeller oysters — you went for it all, Gabriel. That's the Lobsteria experience. Come back! 🦞",

    "AbFvOqkmZh1VGNHIF878L8W6QpFctl9UDK9aCTS6Qsy0ccQFcegqUmo_sMqrr0ZNoMjMcyHEoaFqeg":
        "¡Los mejores ceviches de Wynwood — eso nos hace muy felices! Gracias Kevin, vuelve pronto 🦞",

    "AbFvOqnqeabbPFwPkiHW8rbatk4W7xvSdWQz1VCp6s5PssVIWStYqZgrEwua9zs5SSxKeTrEA1moEA":
        "Amy, the lobster roll + ceviche mixto split is one of our favorite combos. Fresh, laid back, Wynwood — that's Lobsteria. See you next time! 🦞",

    "AbFvOqnXC-MIv9gJFiij-1CO_uyfUUszMbFnRHVfo8745vDDUdBhuPLm-tIBe7483O2vLAf6MRJwMQ":
        "Lobster roll + ceviche mixto — a perfect pairing. Thank you Laura! Highly recommend = exactly what we work for 🦞",

    "AbFvOqmnCA1S7iWGfN_5l_ZGw36gFUoMAhYLsZIgBjWlMW4F49ZmI_4vqZH98zOGSoNpqVwb2iFr":
        "Customer service 10, food 10, atmosphere 10 — that's Lobsteria. Thank you for noticing every detail. See you again! 🦞",

    "AbFvOqlcUN9RlYac1lwNjyOW86ihKclYAAXmOAfGprc-kxSnsDlpqewUiTiznWjq762UsgO_1r545w":
        "¡Espectacular y calidad increíble — eso nos hace muy felices Esteban! Vuelve pronto 🦞",

    "AbFvOqlsaEU-zM1Vcf1OG886c6rBZkVH-u6I6yuVhyj8GlOixxznuo-uikNLKDzTs94-PueCNB7PvQ":
        "Anna, the lobster roll is our signature — glad it delivered! Come back anytime. We're open nightly until 2am 🦞",

    "AbFvOqnT1cqgE3HlIo0QqzU8a8a9QVHlGoGNZMRWQDkhWl6-8X1YUqhZwdFeagDFttyjS6YvPHwe":
        "Thank you! See you next time at the Airstream 🦞",

    "AbFvOqnWwwi5KkQcc-xIWHMyDaQ9FOF_XoYLw2l9lZlsgiN--cFnP9_Yoa_BL0pUh4F1_y846opOmw":
        "Antonio, this review made our day. The Fried Fish Brioche Roll is a hidden gem on the menu — glad it surprised you! We'll see you and your friends back here soon 🦞",

    "AbFvOql3BNWM6seJogo-SM02DwDYeWn96HBJ4hyse2vViQRc6BkgllJ0zaC-gBuj21toa8nvVL0R":
        "¡100% recomendados, súper ricos y frescos — eso es exactamente lo que somos! Gracias, vuelve pronto 🦞",

    "AbFvOqkIX3k0shYHdeyxXlLgRLmkKsFNNH_oKJJ-EmyPM1M8FX2RkWgBitafAszHhsyB1w":
        "Fresh oysters from Canada + Maine lobster — you noticed the sourcing. That's everything to us. Thank you! 🦞",

    "AbFvOqnlNQ-rxziBH4aQnCSA6RNlnYQovjuPbMYizyFbzBltn9IGm8aHo69agY45af12O-2Vfe5t9Q":
        "Lobster roll to die for — we'll take that! Thank you Anthony. Come back and try the caviar add-on next time 🦞",

    "AbFvOqlgQ-oxSLJaBI2BXBrqFOdqV2sxHX5KkBEojcjqMBEwg4sjtuojU-XDIL0pnLJao9GkJR-Teg":
        "Fresh & deli oysters — that's the goal every night Yader. Thank you! 🦞",

    "AbFvOqmtUNfbYpzmal88N6iwUH8QB5AsU0iS--vwn490QHDJalh958orIKH9BfzcOrqQ-Wre56xXZQ":
        "¡Los ostiones con passion fruit son uno de nuestros favoritos! Gracias Christian, vuelve pronto 🦞",

    "AbFvOqkP-q97k3t-2trJTNQlhvdD6OUqvzA3l8aBvpGBn68ixvFEvn3C6Eep15p9yZrGyuNDjrQdCw":
        "Amazing place, amazing lobster — that's the goal. Thank you! 🦞",

    "AbFvOqnHIHtwZF2OaOiEfTm_RsLhHk5CEkmcDl_DUFpB26sWObgvbV8Sgudt0OVGQVv4FFJBf3fleg":
        "Great job thanks to YOU for coming, Rizwan! See you again at the Airstream 🦞",

    "AbFvOqlHfXu-TTxj9GxOJPAIUp_7dDKBjb-Ej2BJqc165P8UPAjQcIbX4vnH-DvY1XDTVFKA":
        "¡Excelente servicio es nuestro estándar! Gracias Jorge, vuelve pronto 🦞",

    "AbFvOqmmqkERjj0eEVd2uhB0aR0bJIZ25yu7HYCbNeihWbKpFJAZG2oBHum3LkK43_aX8UdLxuZfFQ":
        "¡Los mejores ceviches de Wynwood! Gracias Kevin, te esperamos pronto 🦞",

    "AbFvOqmAHBi1qjD-9P8-LQYJ6EtG5nJJiz-aUIbCboqDpCkUwXoYbpwd3dd7QkP9z2SayVMNPWcI":
        "10/10 and amazing service — that's exactly what we aim for every night. Thank you Negeen! 🦞",

    "AbFvOqlKPn_C8JKtsf8CdFnBah704I-Fxo5tGWsHHCBGqFIrUQYNwIJsw17V7rZIbLe58H_15HmwMw":
        "Top tier + great date spot + good music — you nailed the full experience Ousman. Come back! 🦞",

    "AbFvOqnM24G_I4jTOxCjBy4DFAeln9LZQ78lp-nCq1tVzqNO23qcXDbuJmu6Hzt9cJ4Eqdf38yOAQ":
        "¡El mejor ceviche que te recuerda a Perú — Tía Tati estaría muy feliz de escuchar eso! Gracias Dorlimar 🦞",

    "AbFvOqlNw_D705HEp-cJLldw1TK-BLdVWc4KpI7_EawtQep6y5vyg_taMRtjGqhk6Bh6poILP2dsVA":
        "¡El mejor ceviche de tu vida — eso es exactamente lo que queremos! Gracias Eulis, vuelve pronto 🦞",

    "AbFvOqmMekx9nMPkU3CZ9lOkv0dtnIg4JrEeE2O-tSPGIEFBhO2s8kBj1SwNVDUoGOfuvHyGQe7oyA":
        "¡Excelente fried fish sandwich! Gracias Jose, vuelve a probar el lobster roll también 🦞",

    "AbFvOqk8fHMyoj40m679nuXb-AsK2zc21irTc_0z4Pnu6nYAH75tRYdVH2bmhX1wiCe7bdXg05vOVA":
        "Mercy, thank you for coming! Nice experiences are what we're here for. See you again soon 🦞",

    "AbFvOqnfD_sKkxFqIM6N6R9bSUJwiF4UhbzvdsOSnMbH08ERnfuTiOMLslaHfPMeVSCzqlLPqRiKEQ":
        "¡El mejor lobster roll y el chef es excelente — eso nos hace muy orgullosos! Gracias Álvaro 🦞",

    "AbFvOql3gqjzZzjawmW2FDBUn11nae-AWGiooWAelihLHsAWFp1wd19yTFsZOEsnN_rdq-0AFDfd0g":
        "Best meal in Miami and best lobster roll — that’s exactly the bar we set. Thank you Jueun! Come back and try the ceviche next time 🦞",

    "AbFvOqnMydAH4ZZFopjmtFrhrnvol06aXrkFrw986KQf2VvmU0SSXmP4i1hQCYCp049bmOBBCTd3Nw":
        "¡El mejor lobster roll! Gracias Kike, vuelve pronto a la Airstream 🦞",

    "AbFvOqnnb3TkXgsiUOVTcgCIMzDi8OKCcZpc1uVnqlJAjUt-2W2obU9jZKCaoyw2E6tuAM-gIAWtsg":
        "¡Los mejores sándwiches de mariscos, alta cocina, sabores balanceados — gracias Henry! Eso es exactamente lo que somos 🦞",

    "AbFvOqmNgva7g2heNdUqb-Jr8dzZ4rFnay9rnl5l3u0Khqe4e2ChRMrGam1hWWXJRGdpdqvlE0X9TA":
        "¡Delicioso y volvería sin duda! Eso es todo lo que necesitamos escuchar. Gracias Mariana 🦞",

    "AbFvOqlx3b960rgJNqL5uMvOG3rJcGd4dpKL2jX0zPakHrNpvQp8fpWmVPpGSqPCIdQMJQkwQUlCRQ":
        "Fresh food late at night — that's why we stay open until 2am! Thank you Food Lover 🦞",

    "AbFvOqmpTsqcSeigxIju7yZQ06eIBzt_ihbNSwvd1EGZ6keoxdDDh80fjPoWUNDAUZcZwvl8l29Y":
        "¡El mejor sándwich de langostinos del mundo! Natali, eso nos hace muy felices. Vuelve pronto 🦞",

    "AbFvOqnKhR_26s3fMgp1Ru8IFVpB5PI2vAVis2EicI4dIeBltGOPNo2s8kBj1SwNVDUoGOfuvHyGQe7oyA":
        "¡Los mejores ceviches de Wynwood! Gracias, vuelve pronto 🦞",

    "AbFvOqlbulBWxb1LDKeowBvMBsSG3I4ce18SFWOFLG-5-KIsE72DLtWjS5bwZuYD43POyHxKaCiM":
        "Thank you! See you back at the Airstream soon 🦞",

    "AbFvOqnKg1iUkEDcqNk5KModgetbGEVQtjfE-FfNHR0_hd_HCC4_fHDY_QczGqHsxJ1447-YsWv7cA":
        "¡Muy buena atención y calidad de primera! Gracias Sergio, eso es exactamente nuestro estándar 🦞",

    "AbFvOqlt4dA80G6ne6V98ow18OVQWCoi_lUN913NyU8gA4EnJj-Cy6x76r-yZ32VHzVXRp0Ix9ovww":
        "¡Los ostiones con pasión fruit son una de nuestras creaciones favoritas! Gracias, vuelve pronto 🦞",
}

# ─────────────────────────────────────────────
# NEGATIVE REVIEW RESPONSES (need care)
# ─────────────────────────────────────────────
NEGATIVE = {
    # 1-star: harry attisa — "Complete scam"
    "AbFvOqmOEcybJoMIdW3sYaSffaTMGvEWIPjTb3siBxiZ8Mcg0favzG0iOI5MMd1rEFHFTZEigyrwsg":
        "Harry, we're genuinely sorry to hear about this experience. We take every order seriously and this is not the standard we hold ourselves to. Please reach out to us directly at pau@lobsteria.co or 786.850.7848 so we can look into what happened and make it right. We want to hear from you.",

    # 1-star: Alejandro Batsakis — rude employee, closed
    "AbFvOqndw-JpTV2DYShvQvZHi81Vg-vqGg1nzVZsqihko3GKgnxgoki8g01Zk9WCZ1hgeGxG6kY_6w":
        "Alejandro, I'm very sorry about your experience — both the confusion with the order and how your wife was treated. That is not how we handle things here, and it does not reflect our values. Please reach out to me personally at 786.850.7848 or pau@lobsteria.co. I want to make this right.",

    # 1-star: Maria Shalack — website order issue, 30 min wait, cartilage
    "AbFvOqnCXKJ9kFbndX9eF-o0XpWCYzw06hrcbCPDkn3AMld2EmqhQYumMREiGehf0heWUF3NfFJCRg":
        "Maria, thank you for taking the time to share this. I'm sorry your visit didn't meet the standard we set for ourselves — the ordering issue and the wait were not acceptable, and I especially hear you on the roll. We hand-clean every lobster ourselves to avoid exactly that, and I want to understand what happened. Please contact me directly at pau@lobsteria.co or 786.850.7848. I'd like to make it right.",

    # 3-star: Gintare Peciuke — closed when visited, no phone answer
    "AbFvOqnqgM-HomEkhJ9vKbbOK1FmndyfvZgPiIL-eG49mVDhBdtU8-Jf2gxPqLWfH4U4qQkxsoB7tg":
        "Gintare, I'm sorry you made the trip and we weren't there. We're open every day from 5pm to 2am at 144 NE 27th St — and we understand how frustrating it is to show up and find us closed. The best way to confirm we're open is through our Google Business Profile at https://share.google/DlM9jsDc9pUyj9TnF. We'd love to have you come back and finally try it.",

    # 4-star: enes karaaslan — very salty
    "AbFvOqkWiFS7fFCWNTrchmQP7vYAcVpykKsw0GzjYQg5rcgSwurJgtowFJAPmpACub-ywmTsHuAp1g":
        "Enes, thank you for the honest feedback — saltiness is something we take seriously and we'll look into this. Glad the lobster amount and bun were good. We'd love to have you back and make sure it hits the mark next time.",

    # 2-star: Gabriela Richaud — no text
    "AbFvOqmUpQ1pUs2FPYiS-KsqUE5vLaobTeJ3sMOv6oW4pDQq7QoiP6RYZpeeYc_N98WaLSGbJGpe":
        "Gabriela, we'd love to know more about your experience so we can do better. Please reach out to us at pau@lobsteria.co — we take every piece of feedback seriously.",
}

# ─────────────────────────────────────────────
# TEMPLATE POOL — no-text 5-star reviews
# ─────────────────────────────────────────────
TEMPLATES = [
    "Thank you! Made from scratch, every order. See you at the Airstream soon 🦞",
    "We appreciate you! Hope to see you back at Lobsteria very soon 🦞",
    "Thank you so much! Hand-cleaned Maine lobster, every single time. Come back! 🦞",
    "Means a lot — open every night until 2am at 144 NE 27th St. See you soon 🦞",
    "Thank you for coming! Nothing sits here, everything is made when you order it 🦞",
    "Grateful for every visit. The Airstream is here every night — come back anytime! 🦞",
    "Thank you! We put everything into every single roll. See you next time 🦞",
    "5 stars means everything to us. Come back and try the caviar add-on next time 🦞",
    "Thank you so much for supporting Lobsteria! See you at the Airstream 🦞",
    "We appreciate you! Fresh lobster, fresh oysters, made to order every night 🦞",
    "Thank you! This is why we stay open until 2am. Come back soon 🦞",
    "Grateful you came! Every order gets our full attention. See you again 🦞",
    "Thank you! The best lobster roll is made when you're there watching — come back! 🦞",
    "We love seeing you here! Maine lobster, hand-cleaned. Every time. 🦞",
    "Thank you for the 5 stars — we work hard for every one of them. See you soon! 🦞",
]

def get_credentials():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return creds

def post_reply(creds, review_id, reply_text):
    url = f"https://mybusiness.googleapis.com/v4/{ACCOUNT_ID}/{LOCATION_ID}/reviews/{review_id}/reply"
    headers = {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}
    body = {"comment": reply_text}
    resp = requests.put(url, headers=headers, json=body)
    return resp.status_code, resp.json()

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry-run"
    dry_run = mode != "--post"

    if dry_run:
        print("=== DRY RUN — no changes posted ===\n")
    else:
        print("=== LIVE RUN — posting replies ===\n")

    creds = get_credentials()

    with open(REVIEWS_FILE) as f:
        reviews = json.load(f)

    no_reply = [r for r in reviews if "reviewReply" not in r]
    print(f"Reviews needing reply: {len(no_reply)}\n")

    template_idx = 0
    posted = 0
    errors = 0

    for r in no_reply:
        rid = r.get("reviewId", "")
        name = r.get("reviewer", {}).get("displayName", "Guest")
        rating = r.get("starRating", "FIVE")
        comment = r.get("comment", "").strip()

        # Determine response
        if rid in NEGATIVE:
            reply = NEGATIVE[rid]
            tag = "⚠️  NEGATIVE"
        elif rid in CUSTOM:
            reply = CUSTOM[rid]
            tag = "💬 CUSTOM"
        else:
            # Template rotation for no-text or unmatched reviews
            reply = TEMPLATES[template_idx % len(TEMPLATES)]
            template_idx += 1
            tag = "📋 TEMPLATE"

        print(f"{tag} | {rating} | {name}")
        if comment:
            print(f"  Review: \"{comment[:80]}\"")
        print(f"  Reply:  \"{reply}\"")

        if not dry_run:
            status, resp = post_reply(creds, rid, reply)
            if status in (200, 201):
                print(f"  ✅ Posted")
                posted += 1
            else:
                print(f"  ❌ Error {status}: {resp}")
                errors += 1
            time.sleep(0.5)  # rate limit

        print()

    if not dry_run:
        print(f"\n✅ Done — {posted} posted, {errors} errors")
    else:
        print(f"\nDry run complete — {len(no_reply)} replies ready to post.")
        print("Run with --post to publish all replies.")
