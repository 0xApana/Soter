/* eslint-disable */
/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY
 * Generated from contract spec: aid_escrow v0.2.0
 * Run `npm run generate:contract-types` to update this file.
 */

export enum ClaimStatus {
  Success = 0,
  NotFound = 1,
  NotActive = 2,
  ClaimTooEarly = 3,
  Expired = 4,
  RequiresProof = 5,
  Unauthorized = 6,
  CampaignPaused = 7,
  TransferFailed = 8,
}

export type ClaimStatusString = keyof typeof ClaimStatus;

export enum PackageStatus {
  Created = 0,
  Claimed = 1,
  Expired = 2,
  Cancelled = 3,
  Refunded = 4,
}

export type PackageStatusString = keyof typeof PackageStatus;

export enum ContractError {
  NotInitialized = 1,
  AlreadyInitialized = 2,
  NotAuthorized = 3,
  InvalidAmount = 4,
  PackageNotFound = 5,
  PackageNotActive = 6,
  PackageExpired = 7,
  PackageNotExpired = 8,
  InsufficientFunds = 9,
  PackageIdExists = 10,
  InvalidState = 11,
  MismatchedArrays = 12,
  InsufficientSurplus = 13,
  ContractPaused = 14,
  ClaimTooEarly = 15,
  InvalidProof = 16,
  InvalidToken = 17,
  TokenTransferFailed = 18,
  NoPendingTransfer = 19,
  InvalidPendingAdmin = 20,
  BatchTooLarge = 21,
}

export interface ActionPausedEvent {
  admin: string;
  action: string;
}

export interface ActionUnpausedEvent {
  admin: string;
  action: string;
}

export interface AdminTransferAccepted {
  admin: string;
  timestamp: number;
}

export interface AdminTransferCancelled {
  admin: string;
  timestamp: number;
}

export interface AdminTransferInitiated {
  admin: string;
  pending_admin: string;
  timestamp: number;
}

export interface Aggregates {
  total_committed: string;
  total_claimed: string;
  total_expired_cancelled: string;
}

export interface BatchClaimResult {
  package_id: number;
  status: ClaimStatus;
  amount: string;
}

export interface BatchCreatedEvent {
  ids: number[];
  admin: string;
  total_amount: string;
}

export interface CampaignPausedEvent {
  admin: string;
  campaign_ref: string;
}

export interface CampaignUnpausedEvent {
  admin: string;
  campaign_ref: string;
}

export interface Config {
  min_amount: string;
  max_expires_in: number;
  allowed_tokens: string[];
}

export interface ContractPausedEvent {
  admin: string;
}

export interface ContractUnpausedEvent {
  admin: string;
}

export interface DelegateAdded {
  package_id: number;
  recipient: string;
  delegate: string;
  actor: string;
  expires_at: number;
  timestamp: number;
}

export interface DelegateClaimed {
  package_id: number;
  recipient: string;
  delegate: string;
  amount: string;
  actor: string;
  timestamp: number;
}

export interface DelegateHistory {
  package_id: number;
  previous_delegate: string | null;
  new_delegate: string;
  changed_by: string;
  changed_at: number;
  reason: string;
}

export interface DelegateRevoked {
  package_id: number;
  recipient: string;
  delegate: string;
  actor: string;
  timestamp: number;
}

export interface EscrowFunded {
  from: string;
  token: string;
  amount: string;
  timestamp: number;
}

export interface ExtendedEvent {
  package_id: number;
  admin: string;
  old_expires_at: number;
  new_expires_at: number;
}

export interface Package {
  id: number;
  recipient: string;
  amount: string;
  token: string;
  status: PackageStatus;
  created_at: number;
  expires_at: number;
  claim_starts_at: number;
  metadata: Record<string, string>;
}

export interface PackageClaimed {
  package_id: number;
  recipient: string;
  amount: string;
  actor: string;
  timestamp: number;
  receipt_hash: string;
}

export interface PackageClaimedByRelayer {
  package_id: number;
  recipient: string;
  relayer: string;
  amount: string;
  timestamp: number;
}

export interface PackageCreated {
  package_id: number;
  recipient: string;
  amount: string;
  actor: string;
  timestamp: number;
}

export interface PackageDisbursed {
  package_id: number;
  recipient: string;
  amount: string;
  actor: string;
  timestamp: number;
  receipt_hash: string;
}

export interface PackageRefunded {
  package_id: number;
  recipient: string;
  amount: string;
  actor: string;
  timestamp: number;
}

export interface PackageRevoked {
  package_id: number;
  recipient: string;
  amount: string;
  actor: string;
  timestamp: number;
}

export interface SurplusWithdrawnEvent {
  to: string;
  token: string;
  amount: string;
}

export interface TokenAdded {
  admin: string;
  token: string;
  timestamp: number;
}

export interface TokenRemoved {
  admin: string;
  token: string;
  timestamp: number;
}

export interface ContractEvents {
  ActionPausedEvent: {
    admin: string;
    action: string;
  };
  ActionUnpausedEvent: {
    admin: string;
    action: string;
  };
  AdminTransferAccepted: {
    admin: string;
    timestamp: number;
  };
  AdminTransferCancelled: {
    admin: string;
    timestamp: number;
  };
  AdminTransferInitiated: {
    admin: string;
    pending_admin: string;
    timestamp: number;
  };
  BatchCreatedEvent: {
    ids: number[];
    admin: string;
    total_amount: string;
  };
  CampaignPausedEvent: {
    admin: string;
    campaign_ref: string;
  };
  CampaignUnpausedEvent: {
    admin: string;
    campaign_ref: string;
  };
  ContractPausedEvent: {
    admin: string;
  };
  ContractUnpausedEvent: {
    admin: string;
  };
  DelegateAdded: {
    package_id: number;
    recipient: string;
    delegate: string;
    actor: string;
    expires_at: number;
    timestamp: number;
  };
  DelegateClaimed: {
    package_id: number;
    recipient: string;
    delegate: string;
    amount: string;
    actor: string;
    timestamp: number;
  };
  DelegateRevoked: {
    package_id: number;
    recipient: string;
    delegate: string;
    actor: string;
    timestamp: number;
  };
  EscrowFunded: {
    from: string;
    token: string;
    amount: string;
    timestamp: number;
  };
  ExtendedEvent: {
    package_id: number;
    admin: string;
    old_expires_at: number;
    new_expires_at: number;
  };
  PackageClaimed: {
    package_id: number;
    recipient: string;
    amount: string;
    actor: string;
    timestamp: number;
    receipt_hash: string;
  };
  PackageClaimedByRelayer: {
    package_id: number;
    recipient: string;
    relayer: string;
    amount: string;
    timestamp: number;
  };
  PackageCreated: {
    package_id: number;
    recipient: string;
    amount: string;
    actor: string;
    timestamp: number;
  };
  PackageDisbursed: {
    package_id: number;
    recipient: string;
    amount: string;
    actor: string;
    timestamp: number;
    receipt_hash: string;
  };
  PackageRefunded: {
    package_id: number;
    recipient: string;
    amount: string;
    actor: string;
    timestamp: number;
  };
  PackageRevoked: {
    package_id: number;
    recipient: string;
    amount: string;
    actor: string;
    timestamp: number;
  };
  SurplusWithdrawnEvent: {
    to: string;
    token: string;
    amount: string;
  };
  TokenAdded: {
    admin: string;
    token: string;
    timestamp: number;
  };
  TokenRemoved: {
    admin: string;
    token: string;
    timestamp: number;
  };
}

export interface AidEscrowContractFunctions {
  accept_admin(): Promise<void>;
  add_allowed_token(token: string): Promise<void>;
  add_distributor(addr: string): Promise<void>;
  batch_claim(claimant: string, ids: number[]): Promise<BatchClaimResult[]>;
  batch_create_packages(
    operator: string,
    recipients: string[],
    amounts: string[],
    token: string,
    expires_in: number,
    metadatas: Record<string, string>[],
  ): Promise<number[]>;
  cancel_admin_transfer(): Promise<void>;
  cancel_package(package_id: number): Promise<void>;
  claim(id: number): Promise<void>;
  claim_with_proof(
    id: number,
    claimant: string,
    proof: string[],
  ): Promise<void>;
  claim_with_relayer(
    id: number,
    claimant: string,
    relayer: string,
  ): Promise<void>;
  cleanup_expired_delegates(admin: string): Promise<number>;
  clear_delegate(package_id: number): Promise<void>;
  contract_version(): Promise<string>;
  create_package(
    operator: string,
    id: number,
    recipient: string,
    amount: string,
    token: string,
    expires_at: number,
    metadata: Record<string, string>,
  ): Promise<number>;
  disburse(id: number): Promise<void>;
  extend_expiration(package_id: number, additional_time: number): Promise<void>;
  extend_expiry(id: number, new_expires_at: number): Promise<void>;
  fund(token: string, from: string, amount: string): Promise<void>;
  get_admin(): Promise<string>;
  get_aggregates(token: string): Promise<Aggregates>;
  get_authorization_info(
    package_id: number,
    primary_recipient: string,
    claimer: string,
  ): Promise<[boolean, string | null]>;
  get_campaign_claim_count(campaign_ref: string): Promise<number>;
  get_campaign_package_count(campaign_ref: string): Promise<number>;
  get_config(): Promise<Config>;
  get_delegate(package_id: number): Promise<string | null>;
  get_delegate_history(package_id: number): Promise<DelegateHistory[]>;
  get_delegate_info(
    package_id: number,
  ): Promise<[string, number | null] | null>;
  get_package(id: number): Promise<Package>;
  get_pending_admin(): Promise<string | null>;
  get_recipient_package_count(recipient: string): Promise<number>;
  get_total_claimed(token: string): Promise<string>;
  get_total_locked(token: string): Promise<string>;
  get_version(): Promise<number>;
  init(admin: string): Promise<void>;
  is_action_paused(action: string): Promise<boolean>;
  is_authorised_claimer(
    package_id: number,
    primary_recipient: string,
    claimer: string,
  ): Promise<boolean>;
  is_campaign_paused(campaign_ref: string): Promise<boolean>;
  is_paused(): Promise<boolean>;
  list_recipient_packages(
    recipient: string,
    cursor: number,
    limit: number,
  ): Promise<number[]>;
  migrate(new_version: number): Promise<void>;
  pause(): Promise<void>;
  pause_action(action: string): Promise<void>;
  pause_campaign(campaign_ref: string): Promise<void>;
  refund(id: number): Promise<void>;
  remove_allowed_token(token: string): Promise<void>;
  remove_distributor(addr: string): Promise<void>;
  revoke(id: number): Promise<void>;
  revoke_delegate(admin: string, package_id: number): Promise<void>;
  set_config(config: Config): Promise<void>;
  set_delegate(
    admin: string,
    package_id: number,
    delegate: string,
  ): Promise<void>;
  set_delegate_with_expiry(
    admin: string,
    package_id: number,
    delegate: string,
    expires_at: number,
  ): Promise<void>;
  sweep_expired_delegates(limit: number): Promise<number>;
  transfer_admin(new_admin: string): Promise<void>;
  unpause(): Promise<void>;
  unpause_action(action: string): Promise<void>;
  unpause_campaign(campaign_ref: string): Promise<void>;
  view_package_status(id: number): Promise<PackageStatus>;
  withdraw_surplus(to: string, amount: string, token: string): Promise<void>;
}
