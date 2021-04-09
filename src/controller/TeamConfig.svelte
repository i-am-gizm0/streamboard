<script lang="ts">
    import type { GameState } from "../SharedDefinitions";

    export let state: GameState;
    export let team: 'home' | 'away';
</script>

<div class="mb-3"> <!-- Team Name -->
    <label for="teamName" class="form-label">Team Name</label>
    <input type="text" class="form-control" bind:value={state[team].name}>
</div>
<div class="mb-3"> <!-- Team Color -->
    <label for="teamColor" class="form-label">Team Color</label>
    <input type="color" class="form-control form-control-color" bind:value={state[team].color}>
</div>