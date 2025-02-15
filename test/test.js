require('dotenv').config()
const assert = require('assert');
const bitcoin = require('bsv')
const paydata = require('../index');
const Buffer = bitcoin.deps.Buffer
const Tx = bitcoin.Tx
// Private Key for Demo Purpose Only
const privKey = process.env.privKey
const toAddress = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey)).toString()

var utxoSize;
        const address = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey)).toString()
        const explorer = paydata.connect()

        explorer.utxos(address).then((utxos) => {
            if (!utxos) {
                console.log("Error: ", err)
            } else {
                utxoSize=utxos.length
                done()
            }
        })

describe('paydata', function() {

    beforeEach(function(done) {

        done()
    })

    describe('build', function() {
        describe('safe as default', function() {
            it('safe as default', function(done) {
                const options = {
                    format: "bsv",
                    data: [{ op: 78 }, "hello world"]
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx
                    let s = generated.txOuts[0].script.toAsmString()

                    assert(s.startsWith("0 OP_RETURN OP_PUSHDATA4 68656c6c6f20776f726c64"))
                    done()
                });
            })
            it('set safe true', function(done) {
                const options = {
                    safe: true,
                    format: "bsv",
                    data: [{ op: 78 }, "hello world"]
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx
                    let s = generated.txOuts[0].script.toAsmString()
                    assert(s.startsWith("0 OP_RETURN OP_PUSHDATA4 68656c6c6f20776f726c64"))
                    done()
                });
            })
            it('set safe false', function(done) {
                const options = {
                    safe: false,
                    format: "bsv",
                    data: [{ op: 78 }, "hello world"]
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx
                    let s = generated.txOuts[0].script.toAsmString()
                    assert(s.startsWith("OP_RETURN OP_PUSHDATA4 68656c6c6f20776f726c64"))
                    done()
                });
            })
        })
        describe('data only', function() {
            it('opcode', function(done) {
                const options = {
                    safe: false,
                    format: "bsv",
                    data: [{ op: 78 }, "hello world"]
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx
                    let s = generated.txOuts[0].script.toAsmString()
                    assert(s.startsWith("OP_RETURN OP_PUSHDATA4 68656c6c6f20776f726c64"))
                    done()
                });
            })
            it('opcode 2', function(done) {
                const options = {
                    safe: false,
                    format:'bsv',
                    data: ["0x6d02", "hello world", { op: 78 }, "blah blah blah * 10^100"]
                }
                paydata.build(options, function(err, generated) {
                    let s = generated.txOuts[0].script.toString()

                    assert(s.startsWith("OP_RETURN 2 0x6d02 11 0x68656c6c6f20776f726c64 OP_PUSHDATA4 23 0x626c616820626c616820626c6168202a2031305e313030"))
                    done()
                });
            })
            it('push data array', function(done) {
                const options = {
                    safe: false,
                    format:'bsv',                    
                    data: ["0x6d02", "hello world"]
                }
                paydata.build(options, function(err, generated) {
                  
                    // no input (since no one has signed yet)
                    assert.equal(generated.txIns.length, 0)
                    // output has one item (only OP_RETURN)
                    assert.equal(generated.txOuts.length, 1)
                    // the only existing output is a script
                    assert(generated.txOuts[0].script.toString());

                    done()
                });
            })
            it('hex string that represents script', function(done) {
                const options = {
                    safe: false,
                    format:'bsv',
                    data: "0x6a04366430320b68656c6c6f20776f726c64"
                }
                paydata.build(options, function(err, generated) {

                    // no input (since no one has signed yet)
                    assert.equal(generated.txIns.length, 0)
                    // output has one item (only OP_RETURN)
                    assert.equal(generated.txOuts.length, 1)
                    // the only existing output is a script
                    assert(generated.txOuts[0].script.toAsmString());

                    done()
                });
            })
            it('Buffer', function(done) {
                const options = {
                    safe: false,
                    format:'bsv',                  
                    data: [Buffer.from("abc"), "hello world"]
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx;
                    // no input (since no one has signed yet)
                    assert.equal(generated.txIns.length, 0)
                    // output has one item (only OP_RETURN)
                    assert.equal(generated.txOuts.length, 1)
                    // the only existing output is a script
                    assert(generated.txOuts[0].script);

                    done()
                });
            })
        })
        describe('pay only', function() {
            it('to', function(done) {
                const address = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey)).toString()
                const options = {
                    pay: {
                        key: privKey,
                        to: [{ address: address, value: 100 }]
                    }
                }
                paydata.build(options, function(err, tx) {
                    // If only 'key' is included, it will use the default values for
                    // rest of the pay attributes
                    // and make a transaction that sends money to oneself
                    // (since no receiver is specified)
                    let generated = tx;
                    done()
                })
            })
            it('pay.key only', function(done) {
                const options = {
                    safe:false,
                    format:'bsv',
                    pay: {
                        key: privKey
                    }
                }
                paydata.build(options, function(err, generated) {
                    // If only 'key' is included, it will use the default values for
                    // rest of the pay attributes
                    // and make a transaction that sends money to oneself
                    // (since no receiver is specified)

                    // input length utxoSize => from the user specified by the private key
                    assert.equal(generated.txIns.length, utxoSize)
                    // contains a 'changeScript'
                    //assert(generated.changeScript)

                    // output length 1 => the output points to the sender by default
                    assert.equal(generated.txOuts.length, 1)
                    // script is a pubkeyhashout
                    let s = generated.txOuts[0].script
                  // assert(s.isPublicKeyHashOut())

                    // script sends the money to the same address as the sender
                    // specified by the private key
                    const address = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey))

                    assert.equal(address.toString(), bitcoin.Address.fromTxOutScript(s))

                    done()
                });
            })
            it('pay.fee only', function(done) {
                const options = {
                    pay: {
                        fee: 100
                    }
                }
                paydata.build(options, function(err, tx) {
                    // if no key is included,
                    // empty input (since no sender)
                    // empty output (since nothing else is specified)
                    let generated = tx.toJSON();
                    assert.equal(generated.txIns.length, 0)
                    assert.equal(generated.txOuts.length, 0)
                    // TODO CHECK FEES
                    // assert.equal(generated.fee, 100)
                    done()
                })
            })
            it('pay.key and pay.fee', function(done) {
                const options = {
                    pay: {
                        key: privKey,
                        fee: 100
                    }
                }
                paydata.build(options, function(err, tx) {
                    let generated = tx.toJSON();
                    //assert.equal(generated.fee, 100)
                    done()
                })
            })

            /**

              pay.rpc TBD

            **/

        })

        describe('data and pay', function() {
            it('both data and pay', function(done) {
                const options = {
                    safe: false,
                    format:"bsv",
                    data: ["0x6d02", "hello world"],
                    pay: {
                        key: privKey
                    }
                }
                paydata.build(options, function(err, generated) {
                    // input length 1 => from the user specified by the private key
                    assert.equal(generated.txIns.length, utxoSize)
                    // contains a 'changeScript'
                    //assert(generated.changeScript)

                    // must have two outputs
                    assert.equal(generated.txOuts.length, 2)

                    let s1 = generated.txOuts[0].script


                    // the first output is OP_RETURN
                    assert(s1.chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)

                    // the second script is a pubkeyhashout (change address)
                    let s2 = generated.txOuts[1].script
                    assert(bitcoin.Address.fromTxOutScript(s2).toString())
 
                    // script sends the money to the same address as the sender
                    // specified by the private key
                    const address = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey))
                    assert.equal(address.toString(), bitcoin.Address.fromTxOutScript(s2).toString()) 

                    done()
                })
            })
            /*
            it('pay.filter', function(done) {
              const options = {
                data: ["0x6d02", "hello world"],
                pay: {
                  key: privKey,
                  filter: {
                    v: 3,
                    q: {
                      find: {
                      }
                    }
                  }
                }
              }
              paydata.build(options, function(err, tx) {
                let generated = tx.toJSON();

                // input length 1 => from the user specifiec by the private key
                assert.equal(generated.inputs.length, 5)
                // contains a 'changeScript'
                assert(generated.changeScript)

                // must have two outputs
                assert.equal(generated.outputs.length, 2)

                let s1 = new bitcoin.Script(generated.txOuts[0].script)

                // the first output is OP_RETURN
                assert(s1.chunks[0].opcodenum, bitcoin.Opcode.OP_RETURN)

                // the second script is a pubkeyhashout (change address)
                let s2 = new bitcoin.Script(generated.outputs[1].script)
                assert(s2.isPublicKeyHashOut())

                // script sends the money to the same address as the sender
                // specified by the private key
                const address = new bitcoin.PrivKey(privKey).toAddress()
                assert.equal(address.toString(), s2.toAddress().toString())

                done()
              })
              
            })
            */
        })
        describe('attach coins to data', function() {
            it('paying tip to 1 user', function(done) {
                // send to myself
                const receiver = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey)).toString()


                const options = {
                    safe: false,
                    data: ["0x6d02", "hello world"],
                    pay: {
                        key: privKey,
                        to: [{
                            address: receiver,
                            value: 10
                        }]
                    }
                }
                paydata.build(options, function(err, tx) {
                    // output has 3 items
                    assert.equal(tx.txOuts.length, 3)

                    // 1. OP_RETURN
                    let s1 = tx.txOuts[0].script
                    assert(s1.chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)
                    // 2. Manual transaction output
                    // the second script is a pubkeyhashout (change address)
                    let s2 = tx.txOuts[1].script
                    assert(bitcoin.Address.fromTxOutScript(s2))
                    // the value sent is 1000

                    assert.equal(tx.txOuts[1].valueBn.toNumber(), 10)
                    // the receiver address is the address specified in pay.to
                    assert.equal(bitcoin.Address.fromTxOutScript(s2).toString(), receiver)

                    // 3. Change address transaction output
                    let s3 = tx.txOuts[2].script
                    assert(bitcoin.Address.fromTxOutScript(s3))
                    done()
                })
            })
            it('paying tip to 2 users', function(done) {
                // send to myself
                const receiver = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey)).toString()

                const options = {
                    safe: false,
                    format:'bsv',
                    data: ["0x6d02", "hello world"],
                    pay: {
                        key: privKey,
                        to: [{
                            address: receiver,
                            value: 10
                        }, {
                            address: receiver,
                           value: 20
                        }]
                    }
                }
                paydata.build(options, function(err, tx) {
                    // output has 4 items
                    assert.equal(tx.txOuts.length, 4)

                    // 1. OP_RETURN
                    let s1 = tx.txOuts[0].script
                    assert(s1.chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)
                    // 2. Manual transaction output
                    // the second script is a pubkeyhashout (change address)
                    let s2 = tx.txOuts[1].script
                    assert(bitcoin.Address.fromTxOutScript(s2))
                    // the value sent is 1000
                    assert.equal(tx.txOuts[1].valueBn.toNumber(), 10)
                    // the receiver address is the address specified in pay.to
                    assert.equal(bitcoin.Address.fromTxOutScript(s2).toString(), receiver)

                    // 3. Manual transaction output
                    // the third script is a pubkeyhashout (change address)
                    let s3 = tx.txOuts[2].script
                    assert(bitcoin.Address.fromTxOutScript(s3))
                    // the value sent is 1000
                    assert.equal(tx.txOuts[2].valueBn.toNumber(), 20)
                    // the receiver address is the address specified in pay.to
                    assert.equal(bitcoin.Address.fromTxOutScript(s3).toString(), receiver)

                    // 3. Change address transaction output
                    let s4 = tx.txOuts[3].script
                    assert(bitcoin.Address.fromTxOutScript(s4))
                    done()
                })
            })
        })
        describe('tx', function() {
            describe('importing unsigned tx', function() {
                it('tx only', function(done) {
                    // 1. build
                    const options = {
                        safe: false,
                        format:'hex',                        
                        data: ["0x6d02", "hello world"]
                    }
                    paydata.build(options, function(err, exportedTx) {
                        // 2. export

                        // exported transaction is string
                        assert.equal(typeof exportedTx, "string")
                        // 3. re-import
                        paydata.build({
                            safe: false,
                            format:'bsv',                          
                            tx: exportedTx
                        }, function(err, imported_tx) {
                            // the imported transaction should equal the original transaction
                            assert.equal(imported_tx.toString(), exportedTx)
                            done()
                        })
                    })
                })
                it('tx + data', function(done) {
                    // if there's a 'tx' attribute, it should ignore 'data' to avoid confusion
                    const options1 = {
                        safe: false,
                        format:'hex',
                        data: ["0x6d02", "hello world"]
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. build a new transaction using the exported transaction + new data
                        let options2 = {
                            safe: false,
                            format:'hex',
                            tx: tx1,
                            data: ["0x6d02", "bye world"]
                        }
                        paydata.build(options2, function(err, tx2) {
                            assert.equal(tx1, tx2)
                            done()
                        })
                    })
                })
                it('tx + pay', function(done) {
                    // tx1 is an unsigned transaction
                    // and we create a signed version by adding the 'pay' attribute
                    const options1 = {
                        safe: false,
                        format:'bsv',
                        data: ["paydata", "hello world"]
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. build a new transaction using the exported transaction + new data
                        let options2 = {
                            safe: false,
                            format:'bsv',
                            tx: tx1.toHex(),
                            pay: {
                                key: privKey
                            }
                        }
                        paydata.build(options2, function(err, tx2) {
 
                            // tx1's input should be empty
                            assert.equal(tx1.txIns.length, 0)
                            // tx2's input should now have as many as the utxoSize
                            assert.equal(tx2.txIns.length, utxoSize)
   

                            // tx1's output should have one item
                            assert.equal(tx1.txOuts.length, 1)
                            // and it should be an OP_RETURN
                            let script1 = tx1.txOuts[0].script
                            assert(script1.chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)

                            // tx2's output should have two items
                            assert.equal(tx2.txOuts.length, 2)
                            let script2 = [
                                tx2.txOuts[0].script,
                                tx2.txOuts[1].script
                            ]
                            // the first should be OP_RETURN
                            assert(script2[0].chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)
                            // the second script is a pubkeyhashout (change address)
                            assert( bitcoin.Address.fromTxOutScript(script2[1]) )
                            done()
                        })
                    })
                })
                it('tx + pay + data', function(done) {
                    // tx1 is an unsigned transaction
                    // and we create a signed version by adding the 'pay' attribute
                    // but this time we also try to sneak in 'data'
                    // the 'data' should be ignored
                    const options1 = {
                        safe: false,
                        format:'bsv',
                        data: ["0x6d02", "hello world"]
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. build a new transaction using the exported transaction + new data
                        let options2 = {
                            tx: tx1.toHex(),
                            format:'bsv',
                            data: ["0x6d02", "bye world"], // trying to sneak in 'data'
                            pay: {
                                key: privKey
                            }
                        }
                        paydata.build(options2, function(err, tx2) {

                            // tx2's input should now have as many as the utxoSize
                            assert.equal(tx2.txIns.length, utxoSize)

                            // tx2's output should have two items
                            assert.equal(tx2.txOuts.length, 2)
                            let script2 = [
                                tx2.txOuts[0].script,
                                tx2.txOuts[1].script
                            ]
                            // the first should be OP_RETURN
                            assert(script2[0].chunks[0].opCodeNum, bitcoin.OpCode.OP_RETURN)
                            // the second script is a pubkeyhashout (change address)
                            assert(bitcoin.Address.fromTxOutScript(script2[1]))

                            // the script for the original OP_RETURN
                            // should match the new OP_RETURN script
                            // because the 'data' attribute was ignored
                            let script1 = tx1.txOuts[0].script
                            assert.equal(script1.toString(), script2[0].toString())
                            done()
                        })
                    })
                })
            })
            describe('importing signed tx', function() {
                it('tx only', function(done) {
                    const options1 = {
                        safe: false,
                        format:'bsv',
                        data: ["0x6d02", "hello world"],
                        pay: { key: privKey }
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. import transaction
                        paydata.build({ tx: tx1.toHex(),format:'bsv' }, function(err, tx2) {
                            // the imported transaction should have as many as the utxoSize
                            assert.equal(tx2.txIns.length, utxoSize)
                            // the input should have 'script' property
                            assert(tx2.txIns[0].script)
                            // the script should be public key hash in
                            assert(bitcoin.Address.fromTxInScript(tx2.txIns[0].script).toString())

                            // the imported transaction's input script address should match
                            // the address corresponding to the originally imported private key
                            const address = bitcoin.Address.fromPrivKey(bitcoin.PrivKey.fromString(privKey))
                            assert.equal(address.toString(), bitcoin.Address.fromTxInScript(tx2.txIns[0].script).toString() )
                            done()
                        })
                    })
                })
                it('tx + data', function(done) {
                    // the transaction has already been signed
                    // the data should be ignored
                    // Better yet, this shouldn't be used
                    const options1 = {
                        safe: false,
                        format:'hex',
                        data: ["0x6d02", "hello world"],
                        pay: { key: privKey }
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. import transaction
                        paydata.build({
                            tx: tx1,
                            data: ["0x6d02", "bye world"]
                        }, function(err, tx2) {
                            assert(err.toString(), "the transaction is already signed and cannot be modified")
                            assert.equal(tx2, undefined)
                            done()
                        })
                    })
                })
                it('tx + pay', function(done) {
                    // the transaction has already been signed
                    // the pay attribute should be ignored
                    // and throw and error
                    const options1 = {
                        safe: false,
                        format:'bsv',
                        data: ["0x6d02", "hello world"],
                        pay: { key: privKey }
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. import transaction
                        // But this time, we're updating the key attribute.
                        // This should re-sign the transaction
                        paydata.build({
                            tx: tx1.toHex(),
                            pay: {
                                key: privKey
                            }
                        }, function(err, tx2) {
                            assert(err.toString(), "the transaction is already signed and cannot be modified")
                            assert.equal(tx2, undefined)
                            done()
                        })
                    })
                })
                it('tx + pay + data', function(done) {
                    const options1 = {
                        safe: false,
                        data: ["0x6d02", "hello world"],
                        pay: { key: privKey }
                    }
                    // 1. build initial transaction
                    paydata.build(options1, function(err, tx1) {
                        // 2. import transaction
                        // But this time, we're updating the key attribute.
                        // This should re-sign the transaction
                        paydata.build({
                            safe: false,
                            tx: tx1.toHex(),
                            data: ["0x6d02", "bye world"],
                            pay: {
                                key: privKey
                            }
                        }, function(err, tx2) {
                            assert(err.toString(), "the transaction is already signed and cannot be modified")
                            assert.equal(tx2, undefined)
                            done()
                        })
                    })
                })
            })
        })
    })
    describe('advanced', function() {
        describe('bitcoin', function() {
            it('exposes bitcoin', function() {
                assert(paydata.bsv.Address)
                assert(paydata.bsv.Script)
            })
        })
        describe('connect', function() {
            it('default', function() {
                var explorer = paydata.connect();
                assert.equal(explorer.constructor.name, "WhatsOnChain")
                assert.equal(explorer.url, 'https://api.whatsonchain.com/v1/bsv')
            })
            it('connect with url', function() {
                var explorer = paydata.connect('https://api.whatsonchain.com');
                assert.equal(explorer.constructor.name, "WhatsOnChain")
                assert.equal(explorer.url, 'https://api.whatsonchain.com')
            })
        })
    })
})