import { Connector, ConnectorData } from 'wagmi';
import { sequence, Wallet } from '0xsequence';
import { providers } from 'ethers';

function normalizeChainId(chainId?: string | number | bigint) {
  if (typeof chainId === 'string')
    return Number.parseInt(
      chainId,
      chainId.trim().substring(0, 2) === '0x' ? 16 : 10,
    );
  if (typeof chainId === 'bigint') return Number(chainId);
  return chainId || 1;
}

export class SequenceWalletConnector extends Connector<sequence.WalletProvider, any, providers.JsonRpcSigner> {
  id = 'sequenceWallet';
  name = 'Sequence';
  ready = true;
  private wallet?: Wallet;

  async connect(
    config?: { chainId?: number | undefined } | undefined,
  ): Promise<Required<ConnectorData<any>>> {
    const provider = await this.getProvider(config, true);
    await provider.connect();
    provider.on('accountsChanged', this.onAccountsChanged.bind(this));
    provider.on('chainChanged', this.onChainChanged.bind(this));
    provider.on('disconnect', this.onDisconnect.bind(this));

    const web3Provider = provider.getProvider(config?.chainId);
    const chainId = await this.getChainId();
    const id = normalizeChainId(chainId);

    return {
      account: await provider.getAddress(),
      chain: {
        id: normalizeChainId(config?.chainId),
        unsupported: this.isChainUnsupported(id),
      },
      provider: web3Provider,
    };
  }
  async disconnect(): Promise<void> {
    const provider = await this.getProvider();
    provider.disconnect();
  }
  async getAccount(): Promise<string> {
    const provider = await this.getProvider();
    return provider.getAddress();
  }
  async getChainId(): Promise<number> {
    const provider = await this.getProvider();
    const chainId = await provider.getChainId();
    return chainId;
  }

  async getProvider(
    config?: { chainId?: number | undefined } | undefined,
    force = false,
  ): Promise<Wallet> {
    const chain = this.chains.find(chain => chain.id === config?.chainId);

    if (!this.wallet || force) {
      this.wallet = await sequence.initWallet(config?.chainId, {
        networkRpcUrl: chain?.rpcUrls.default
      });
      (this.wallet as any).removeListener = () => undefined;
    }
    return this.wallet;
  }

  async getSigner(
    config: { chainId?: number | undefined } | undefined = {},
  ): Promise<any> {
    const provider = await this.getProvider(config);
    const signer = provider.getSigner(config.chainId);
    signer.connectUnchecked = () => signer;
    return signer;
  }

  async isAuthorized(): Promise<boolean> {
    const provider = await this.getProvider();
    return provider.isConnected();
  }

  protected onAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) this.emit('disconnect');
    else this.emit('change', { account: accounts[0] });
  }

  protected onChainChanged(chain: string | number): void {
    const id = normalizeChainId(chain);
    this.emit('change', {
      chain: { id, unsupported: this.isChainUnsupported(id) },
    });
  }
  protected onDisconnect(): void {
    this.emit('disconnect');
  }
}
