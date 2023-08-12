# Paydata

Paydata is the simplest library for building and broadcasting data transactions to the **Bitcoin SV blockchain**.

#### Developer fee

Signed transactions include 10 satoshis as developer fee to keep libraries updated and improved.


---

# Preview

Post to the blockchain with just 4 lines of code. 

```
Paydata.send({
  safe: true,
  pay: { key: privateKey },
  data: ["0x6d02", "Hello from Paydata"]
});
```

---

# Demo

## 1. Paydata Transaction Composer

- [Paydata transaction composer](https://bsv.direct/lib/paydata/composer.html)

- [View source](example/composer.html)

## 2. Microblogging Playground

Post to both memo.sv and other compatible dapps with a single interface.

- [DEMO](https://bsv.direct/lib/paydata/playground.html)

- [View source](example/playground.html)

## 3. Ordinal Playground

Create 1satordinals and inscribe onchain

- [DEMO](https://bsv.direct/lib/paydata/1satordinal.html)

- [View source](example/1satordinal.html)

---


# Install

## 1. In node.js

Install both `paydata` and `bsv2` (Paydata has a peer dependency on bsv2)

```
npm install @samooth/paydata
```

and then require it

```
const paydata = require('@samooth/paydata')
```

## 2. In browser

```
<script src='https://unpkg.com/@samooth/paydata'></script>
```
or

```
<script src='https://bsv.direct/lib/paydata.min.js'></script>
```



---

# Quickstart

Send `"Hello from Paydata"` to [memo.sv](https://memo.sv) in 5 lines of code.


```
const privateKey = [YOUR PRIVATE KEY HERE];
paydata.send({
  safe: true,
  pay: { key: privateKey },
  data: ["0x6d02", "Hello from Paydata"]
});
```

Above code builds an `OP_RETURN` transaction with `0x6d02 hello` as push data, and broadcasts it to Bitcoin SV network.

---

# Declarative Programming

Paydata lets you build a transaction in a declarative manner. Here's an example:

```
var config = {
  safe: true,
  feeKb: 50,
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    to: [{
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 1000
    }]
  },
  data: ["0x6d02", "hello from Paydata"]

}
```

Above config describes a transaction that:

- Posts `"hello from Paydata"` to [memo.sv](https://memo.sv) network (See the protocol at [https://memo.sv/protocol](https://memo.sv/protocol)),
- paying the fee of `50` satoshis per kilobyte,
- signed with a private key: `5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw`,
- through Bitails endpoint at [https://bitails.io](https://bitails.io)
- while tipping the user `1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81` a value of `1000` satoshis.

All you need to do to invoke it is call:

```
paydata.send(config)
```

Want to instead build a transaction but save it for later or export it? Just call:

```
paydata.build(config, function(error, tx) {
  console.log("Here's the transaction! : ", tx)
})
```

And that's it! No complex APIs, but you can construct pretty much all kinds of transactions.

---

# How it works

`Paydata` is powered by [bsv](https://github.com/samooth/bsv), which in turn is a fork of [bitcore-lib](https://github.com/bitpay/bitcore-lib), which means all the low level transactions are completely robust and secure, since they're being used in production at companies like:

- [Moneybutton](https://moneybutton.com)
- [Bitpay](https://bitpay.com)
- and more

`Paydata` was created in order to make it dead simple to construct `OP_RETURN` related transactions, but you can even use it to build regular transactions.

Also `Paydata` exposes `Paydata.bsv` endpoint which you can use to access the underlying `bsv` library. If you need more sophisticated features (in most cases you won't), feel free to use this feature. Best of both worlds!

---

# API

Paydata is designed with a different philosophy than conventional Bitcoin transaction libraries.

While **traditional Bitcoin libraries focus on sending money**, Paydata is focused on **sending data**.

The API is optimized to make this as simple as possible. Paydata library has only two methods:

1. `build`: For building a transaction (but not sending)
2. `send`: For sending a transaction


## 1. build

"build" builds a transaction but doesn't broadcast it to the network.

The `build()` method takes two arguments:

1. A JSON object describing the type of transaction
2. **A callback function that will be called after building the transaction:** The callback function has two arguments. The first is an error object if something fails. The second is the constructed transaction.

The first argument--a declarative JSON object--can contain the following attributes:

- `pay`: For describing everything related to actually sending money (optional)
- `data`: For constructing `OP_RETURN` data


- `network`: Selects the network, `main` for Mainnet or `test` for testnet
- `safe`: Please set to `true`. This will create a "safe" `OP_FALSE OP_RETURN` transaction instead of raw `OP_RETURN`. ([Learn more](https://bitcoinsv.io/2019/07/27/the-return-of-op_return-roadmap-to-genesis-part-4/))
- `opReturn`: Switch OP_RETURN flag to off in case is needed, will remove `OP_RETURN` from script.
- `tx`: For importing previously "built" transactions (optional)
- `feeKb`: Fee per Kb (optional: default is 1)
- `lock`: nLocktime (optional: default is 0)
- `seq`: nSequence to apply to all utxos (optional: default MAX)
- `utxos`: Array of utxos to use as inputs (optional: default queries API), custom `hashType`, `seq` and `script` can be specified per utxo.
- `hashType`: Custom SIGHASH flag to apply to all utxos (optional: default is `all`)



---

## 2. send

Instead of just building, you can build AND send. Same syntax as `build()`.

The only difference is the callback function.

- build() returns a constructed transaction object through the callback
- send() returns a transaction hash (since it's already been sent)

### A. Sending from data and pay

```
const tx = {
  safe: true,
  pay: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" },
  data: ["0x6d02", "hello world"])
}
paydata.send(tx, function(err, res) {
  console.log(res)
})
```

### B. Building an UNSIGNED transaction and exporting, and then later importing and sending the transaction in separate steps

```
// Build and export an unsigned transaction for later usage
var exportedTxHex = "";
const tx = {
  safe: true,
  data: ["0x6d02", "hello world"]
}
paydata.build(tx, function(err, res) {
  exportedTxHex = res.toHex();
})

// Later import exportedTxHex and sign it with privatkey, and broadcast, all in one method:
paydata.send({
  tx: exportedTx,
  pay: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}, function(err, hash) {
  // hash contains the transaction hash after the broadcast
})
```

### C. Building a SIGNED transaction and exporting, and then later importing and sending

This time since the exported transaction is already signed, no need for additional `pay.key` attriute when sending later


```
// Build and export an unsigned transaction for later usage
var exportedSignedTxHex = "";
const tx = {
  safe: true,
  pay: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" },
  data: ["0x6d02", "hello world"]
}
paydata.build(tx, function(err, res) {
  exportedSignedTxHex = res.toHex();
})

// Later import exportedTxHex and broadcast, all in one method:
paydata.send({
  tx: exportedSignedTx,
}, function(err, hash) {
  // hash contains the transaction hash after the broadcast
})
```

---

### B. data

The `data` attribute is used to construct human readable/processable data to post to the blockchain.


#### 1. Buid from push data array


```
const tx = {
  safe: true,
  data: ["0x6d02", "hello world"]
}
daydata.build(tx, function(err, tx) {  
  /**
  * res contains the generated transaction object, powered by bsv
  * You can check it out at https://bsv.direct/docs/bsv.js/tx.html
  * Some available methods you can call on the tx object are:
  * 1. tx.toHex() => Export as string
  * 2. tx.toJSON() => Inspect the transaction as JSON object
  **/
});
```

**NOTE:** Each item in the `data` array can either be:

1. a regular string
2. a hex string
3. Binary data ([Buffer](https://nodejs.org/api/buffer.html) in node.js, and [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) in browser)

**To use hex string, simply prefix the string with "0x"**. 

**To use Buffer types, just pass the Buffer (or ArrayBuffer) object as push data.**

**To use an opcode, pass an object `{op: [OPCODE]}`** (You can see the OPCODE list [here](https://github.com/samooth/bsv/blob/master/lib/opcode.js#L78))

In above example, we can see that the first item is `"0x6d02"`. Paydata will automatically recognize this as a hex string and interpret as a hex string (while discarding the 0x prefix before the interpretation)


#### 2. Build from Binary Data + String

In Node.js (Buffer)

```
const tx = {
  safe: true,
  data: ["0x6d02", Buffer.from("Abc"), "hello world"]
}
paydata.build(tx, function(err, tx) {  
  /**
  * res contains the generated transaction object, powered by bsv
  * You can check it out at https://github.com/samooth/bsv/blob/master/lib/transaction/transaction.js
  * Some available methods you can call on the tx object are:
  * 1. tx.toHex() => Export as string
  * 2. tx.toJSON() => Inspect the transaction as JSON object
  **/
});
```

In Browser, building OP_RETURN from `input[type=file]` (ArrayBuffer)

```
document.querySelector("input[type=file]").onchange = function(e) {
  // get file type
  var filetype = e.target.files[0].type
  var reader = new FileReader();
  // Listen to file load event (Will call the actual load below)
  reader.addEventListener('load', function(event) {
    // ArrayBuffer
    var ab = event.target.result
    paydata.build({
      data: [ "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut", ab, filetype ]
    }, function(err, res) {
      console.log("built transaction = ", res)
    })
  })
  // Read file content as "ArrayBuffer"
  reader.readAsArrayBuffer(e.target.files[0]);
}
```

#### 3. Build from hex string representing the script

This is useful if you want to export a transaction and later recover it.
By default transaction returned is in BSV format.

```
const tx = {
  data: "6a04366430320b68656c6c6f20776f726c64"
}
paydata.build(tx, function(err, tx) {
  /**
  * res contains the generated transaction object, powered by bsv
  * You can check it out at https://github.com/samooth/bsv/blob/master/lib/transaction/transaction.js
  * Some available methods you can call on the tx object are:
  * 1. tx.toHex() => Export as string
  * 2. tx.toJSON() => Inspect the transaction as JSON object
  **/
});
```

---

### A. pay

The `pay` attribute deals with everything related to actually sending money.

- `key`: Signing with private key
- `to`: Attaching tips on top of OP_RETURN messages (Normally OP_RETURN transactions don't have a receiver)

When a `pay` attribute is present, the `build()` call generates a `transaction` instead of a `script`.

#### 1. `key`

The `key` attribute is mandatory. You must specify a private key in order to sign a transaction.

```
const tx = {
  safe: true,
  data: ["0x6d02", "hello world"],
  pay: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}
paydata.build(tx, function(err, tx) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```



#### 2. `to`

The `to` attribute is an array of receivers to send the OP_RETURN to. Normally this is left empty because most `OP_RETURN` transactions are meant to have no receivers. But you can also send it to multiple users. For example you can use this feature to send tips to one or more people.

- default: `null`
- Each item in the `to` array can have 2 attributes:
  - address: Bitcoin SV address string
  - value: number (in satoshi)

```
const tx = {
  safe: true,
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    to: [{
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 500
    }, {
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 500
    }]
  },
  data: ["0x6d02", "hello world"]
};
paydata.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included.
  * Also, the transaction includes actual coin transfer outputs,
  * since the "to" attribute is included)
  **/
})
```


### General arguments

#### network

The `network` can be 'main' for Mainnet or 'test' for Testnet


#### api

The `api` attribute is used to manually set the JSON-RPC endpoint you wish to broadcast through. 

- default: `woc`  ( options: bitails, woc, electrumx )

```
const tx = {
  api: "bitails",
  safe: true,
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
  },  
  data: ["0x6d02", "hello world"]
};
paydata.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```

#### feeKb

The `feeKb` attribute is used to specify the transaction fee per kilobyte in **satoshis**.

- default: `1`

```
const tx = {
  safe: true,
  feeKb: 50,
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
  },
  data: ["0x6d02", "hello world"]
}
paydata.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```

#### utxos

Sometimes you want more fine-grained control over which UTXOs to use for a transaction.

Paydata enables to specify an array of utxos to be spent, an even include the locking script.

Use with boolean option `useAllUtxos` set to `true`

```
let lockScript = Script.fromAsmString("OP_TRUE OP_RETURN ...");
const tx = {
  safe: true,
  useAllUtxos: true,
  utxos:[
          { tx_hash:"83a884fe039114150e79fb5326a0a3c3e75895b728d74b4c4aa93bb782850ca2", tx_pos:0, value: 1 },
          { txid:"83a884fe039114150e79fb5326a0a3c3e75895b728d74b4c4aa93bb782850ca2", vout:1, satoshis: 1 },
          { txid:"83a884fe039114150e79fb5326a0a3c3e75895b728d74b4c4aa93bb782850ca2", vout:1, satoshis: 1, script: lockingScript },
        ],
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    }
  },
  data: ["0x6d02", "hello world"]

}
Paydata.build(tx, function(err, tx) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```

---

####  tx

You may want to import a previously exported transaction. This is when you use the `tx` attribute.

##### 1. Importing a transaction from exported hex string

```
paydata.build({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000"
}, function(err, tx) {
  // 'tx' is a transaction object
})
```

##### 2. Importing an unsigned transaction and building a signed transaction

You can export an unsigned transaction, and later import and sign it to create a signed transaction, simply by supporting a `pay.key` attribute.

```
// import an unsigned transaction and sign it
paydata.build({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000",
  pay: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw"
  }
}, function(err, tx) {
  // 'tx' is a signed transaction object
})
```

Notice how in addition to the `tx` attribute we've added the `pay.key` attribute. This will import the unsigned transaction and sign it.


##### 3. Importing and sending a signed transaction from exported hex string

If you already have a signed transaction object, you can simply send it away without any additional steps.

```
paydata.send({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000"
}, function(err, hash) {
  // 'hash' is the transaction hash
})
```

---


# Advanced


## Multipe Outputs

In case of several outputs to be needed use nData option instead of data.
```javascript
const tx = { nData:[ [ "ThisIsOutputNumber 0" ], [ "ThisIsOutputNumber 1" ]  ]}
```

To add some satoshis to all outputs produced by nData, the option `dataSats` must be used to specify the amount.

## Custom nLocktime and nSequence

Paydata enables customizing nLocktime and nSequence by using the arguments `lock` and `seq` 

- `lock`: Specify nLock time for tx

- `seq`: Specify nSequence for input(s), can be specified per utxo or as general option to apply to all inputs



## Custom SIGHASH flags

Create custom signature types using option `hashType` either as general option or as per each utxo on the `utxos` option

The possible signature types are:

`all` `single` `none` `all|any` `single|any` `none|any`


Paydata depends on two powerful libraries for low level stuff.

1. bsv: https://github.com/samooth/bsv
2. explorer wrapper: https://github.com/samooth/explorer

While Paydata is designed to be the simplest possible way to write data to the blockchain, you may want to sometimes access the low level libraries that power Paydata.

Paydata exposes additional endpoints so you can simply access these libraries without having to install or include any additional libraries.


## 1. Paydata.bsv

This endpoint exposes the [bsv](https://github.com/samooth/bsv) library object. Basically by referncing `bsv` you have access to the entire bsv library.

```
const bsv = paydata.bsv
const { PrivKey, Address } = bsv
const privateKey = new PrivKey.fromRandom();
const address = Address.fromPrivKey(privateKey);
console.log(address.toString())
```

## 2. Paydata.connect

This endpoint is used to access the [explorer](https://github.com/samooth/explorer) library.

Using this endpoint you can connect to a public API endpoint to let you make various direct API function calls such as `utxos(<address>)`, etc. (Basically it instantiates and returns the `Explorer` object from https://github.com/samooth/explorer)

### Syntax

```
paydata.connect([network],[params])
```

If you leave the `network` part out, it will automatically connect to mainnet 

params = { api: 'woc'||'bitails'||'electrumx' }

default API: [bitails] https://docs.bitails.io
woc: [WhatsOnChain](https://docs.taal.com/core-products/whatsonchain)

### Example 1: Connecting to default node and calling `utxos()` method:

```
let explorer = paydata.connect()
explorer.utxos("14xMz8rKm4L83RuZdmsHXD2jvENZbv72vR", function(err, utxos) {
  if (err) {
    console.log("Error: ", err)
  } else {
    console.log(utxos) 
  }
})
```

### Example 2. Specifying an API endpoint

```
paydata.connect('main',{api:"woc"}).utxos("14xMz8rKm4L83RuZdmsHXD2jvENZbv72vR", function(err, utxos) {
  if (err) {
    console.log("Error: ", err)
  } else {
    console.log(utxos) 
  }
});
```



