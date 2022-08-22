# [Sequence Wallet](https://sequence.xyz/) connector for [wagmi](https://wagmi.sh/)

## How to use
### Install package

`npm install sequence-connector-wagmi@latest`

### Use it in your code

```TSX
import { WagmiConfig, createClient } from 'wagmi';
import { getDefaultProvider } from 'ethers';
import { SequenceWalletConnector } from 'sequence-connector-wagmi';

const client = createClient({
  autoConnect: true,
  provider: getDefaultProvider(),
  connectors: () => [new SequenceWalletConnector({})],
});

function App() {
  return (
    <WagmiConfig client={client}>
      {'your app'}
    </WagmiConfig>
  );
}

```
