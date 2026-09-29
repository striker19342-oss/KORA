# Privacy model
| An observer can learn | An observer cannot learn |
|---|---|
| Auction ID, deadline, eligibility outcome, one-time nullifier, transaction ID | Bid amount, bidder secret, private witness, identity, local device state |

`disclose()` is limited to the eligibility boolean and nullifier. The former lets a verifier apply the public rule; the latter prevents replay without exposing the secret that created it.
