/**
 * Application-level capability switches.
 *
 * Implementations stay in the codebase when a capability is disabled. Change
 * only this configuration to make the capability available again.
 */
export const APPLICATION_CAPABILITIES: Readonly<{
  httpMode: boolean;
}> = Object.freeze({
  httpMode: false,
});
