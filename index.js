const mingo = require("mingo")
const bitcoin = require('bsv');
const _Buffer = bitcoin.deps.Buffer
//const explorer = require('bitcore-explorers');
const Explorer = require('../bitails/src/index.js');
const defaults = {
    rpc: "api.bsv.direct/e2",
    fee: 50,
    feeb: 0.05
}
// The end goal of 'build' is to create a hex formated transaction object
// therefore this function must end with _tx() for all cases 
// and return a hex formatted string of either a tranaction or a script
var build = function(options, callback) {
    let script = null;
    let rpcaddr = (options.pay && options.pay.rpc) ? options.pay.rpc : defaults.rpc;
    if (options.tx) {
        // if tx exists, check to see if it's already been signed.
        // if it's a signed transaction
        // and the request is trying to override using 'data' or 'pay',
        // we should throw an error
        let tx = bitcoin.Tx.fromBr(new bitcoin.Br(_Buffer.from(options.tx, "hex")))

        // transaction is already signed
        if (tx.txIns.length > 0 && tx.txIns[0].script) {
            if (options.pay || options.data) {
                callback(new Error("the transaction is already signed and cannot be modified"))
                return;
            }
        }
    } else {

        // construct script only if transaction doesn't exist
        // if a 'transaction' attribute exists, the 'data' should be ignored to avoid confusion
        if (options.data) {
            script = _script(options)
        }

    }

    // Instantiate pay
    if (options.pay && options.pay.key) {
        // key exists => create a signed transaction
        let key = options.pay.key;
        const privateKey = bitcoin.PrivKey.fromString(key);
        let address
        if (options.testnet) {
            address = bitcoin.Address.Testnet.fromPrivKey(privateKey);
        } else {
            address = bitcoin.Address.fromPrivKey(privateKey);
        }
        let network = options.testnet ? "test" : "main";

        const explorer = new Explorer(network);
        const makeTx = (res) => {

            if (!res) {
                callback(err);
                return;
            }
            if (!res.unspent.length) {
                console.log("Empty wallet, no utxos")
            }
            if (options.pay.filter && options.pay.filter.q && options.pay.filter.q.find) {
                let f = new mingo.Query(options.pay.filter.q.find)
                res = res.filter(function(item) {
                    return f.test(item)
                })
            }
            let tx

            let builder = new bitcoin.TxBuilder();
            //  console.log(options)
            if (options.tx) {
                tx = bitcoin.Tx.fromBr(new bitcoin.Br(_Buffer.from(options.tx, "hex")))

            } else {
                tx = new bitcoin.Tx()
            }
            builder.tx = tx

            builder.setFeePerKbNum(50)
            builder.dust = 0

            if (script) {
                builder.outputToScript(new bitcoin.Bn(0), script);
            }
            if (options.nData) {
                options.nData.forEach((data)=>{
                    try{
                    builder.outputToScript(new bitcoin.Bn(0), _script({data:data}));
                    }catch(e){
                        console.log(e)
                    }

                })
            }            
            if (options.pay && Array.isArray(options.pay.to)) {
                options.pay.to.forEach(function(receiver) {
                    let dAddress = ""
                    if (options.testnet) {
                        dAddress = bitcoin.Address.Testnet.fromString(receiver.address)
                    } else {
                        dAddress = bitcoin.Address.fromString(receiver.address)
                    }
                    builder.outputToAddress(new bitcoin.Bn(receiver.value), dAddress)

                })
            }
            builder.buildOutputs();



            res.unspent.forEach((utxo) => {
                const fundTxOut = bitcoin.TxOut.fromProperties(
                    new bitcoin.Bn(utxo.satoshis),
                    address.toTxOutScript()
                )

                const fundTxHashBuf = _Buffer.from(utxo.txid, 'hex').reverse()

                builder.inputFromPubKeyHash(fundTxHashBuf, utxo.vout, fundTxOut)

            })

            builder.setChangeAddress(address);


            let laTx = builder.build({ useAllInputs: true })
            //Filter the tx for some requirements
            /*
      for(var i=0;i<tx.outputs.length;i++){
        if(tx.outputs[i]._satoshis>0 && tx.outputs[i]._satoshis<546){
          tx.outputs.splice(i,1);
          i--;
        }
      }
*/
            const keyPairs = [bitcoin.KeyPair.fromPrivKey(bitcoin.PrivKey.fromString(options.pay.key))]
            builder.signWithKeyPairs(keyPairs)
            // build tx

            let opt_pay = options.pay || {};
            // let myfee = opt_pay.fee || Math.ceil(builder.estimateSize() * (opt_pay.feeb || defaults.feeb));

            // Adding option to return tx on bsv format if specified
            let returnThis = options.format === "hex" ?  builder.tx.toHex() : builder.tx;
            callback(null, returnThis);
        }

        let utxoSet = Array()
        let offset = 0

        explorer.utxos(address.toString(), 0, 100).then((res) => {
            makeTx(res)

        })


    } else {
        // key doesn't exist => create an unsigned transaction
        let fee = (options.pay && options.pay.fee) ? options.pay.fee : defaults.fee;

        let tx = new bitcoin.Tx()
        if (options.tx) {
            // options.tx can be hexstring or buffer
            tx = typeof options.tx === "string" ? bsv.Tx.fromHex(options.tx) : bsv.Tx.fromBr(new bsv.Br(options.tx))
        }
        let builder = new bitcoin.TxBuilder(tx);

        builder.setFeePerKbNum(fee)
        builder.dust = 0



        if (script) {
            tx.addTxOut(new bitcoin.Bn(0), script);
        }
        if (options.pay && Array.isArray(options.pay.to)) {
            options.pay.to.forEach(function(receiver) {

                let dAddress = ""
                if (options.testnet) {
                    dAddress = bitcoin.Address.Testnet.fromString(receiver.address)
                } else {
                    dAddress = bitcoin.Address.fromString(receiver.address)
                }
                tx.addTxOut(new bitcoin.Bn(receiver.value), dAddress)
            })
        }
        builder.buildOutputs()
        // Adding option to return tx on bsv format if specified
        let returnThis = options.format === "hex" ? builder.tx.toHex(): builder.tx ;
        callback(null, returnThis);

    }
}
var send = function(options, callback) {
    if (!callback) {
        callback = function() {};
    }

    build(options, function(err, tx) {
        if (err) {
            callback(err);
            return;
        }
        let rpcaddr = (options.pay && options.pay.rpc) ? options.pay.rpc : defaults.rpc;
        let network = options.testnet ? "test" : "main";

        const explorer = new Explorer(network)
        explorer.broadcast(tx.toHex()).then((latx) => {
            callback(null, latx)
        }).catch((e) => { callback(e, null) })
        /*explorer.broadcastBinary( Buffer.from(tx,"hex") ).then((latx) => {
            callback(null, latx)
        }).catch((e) => { callback(e, null) })*/

    })
}
// compose script
var _script = function(options) {

    var s = null;
    if (options.data) {
        if (Array.isArray(options.data)) {
            s = new bitcoin.Script();
            if (!options.hasOwnProperty("safe")) {
                options.safe = true;
            }
            if (!options.hasOwnProperty("opReturn")) {
                options.opReturn = true;
            }
            if (options.safe) {
                s.writeOpCode(bitcoin.OpCode.OP_FALSE);
            }
            if (options.opReturn) {
                // Add op_return
                s.writeOpCode(bitcoin.OpCode.OP_RETURN);
            }


            options.data.forEach(function(item) {
                // add push data
                if (item.constructor.name === 'ArrayBuffer') {
                    let buffer = _Buffer.from(item)
                    s.writeBuffer(buffer)
                } else if (item.constructor.name === 'Buffer') {
                    s.writeBuffer(item)
                } else if (typeof item === 'string') {
                    if (/^0x/i.test(item)) {
                        // ex: 0x6d02
                        s.writeBuffer(Buffer.from(item.slice(2), "hex"))
                    } else {
                        // ex: "hello"
                        s.writeBuffer(Buffer.from(item))
                    }
                } else if (typeof item === 'object' && item.hasOwnProperty('op')) {
                    s.writeOpCode(item.op)
                }
            })
        } else if (typeof options.data === 'string') {
            // Exported transaction 

            s = bitcoin.Script.fromString(options.data);
        }
    }
    return s;
}
var connect = function(network = "main") {
   // var rpc = options.rpc? options.rpc : defaults.rpc;

    return new Explorer(network);

}
module.exports = {
    build: build,
    send: send,
    bsv: bitcoin,
    connect: connect,
}