<script lang="ts">
    import {
        Col,
        Form,
        FormGroup,
        Label,
        Input
    } from 'sveltestrap';
    import type { HockeyState, Team } from '../../../games/hockey';
    import type { RecursivePartial } from '../../../SharedUtilities';

    export let team: { name: string; color: string; };
    export let teamType: string;
    export let partialStateUpdate: (state: RecursivePartial<HockeyState>) => void;

    function updateTeamName(e: InputEvent) {
        partialStateUpdate({
            [teamType.toLowerCase()]: <Partial<Team>>{
                name: (<HTMLInputElement>e.target).value
            }
        });
    }

    function updateTeamColor(e: FocusEvent) {
        partialStateUpdate({
            [teamType.toLowerCase()]: <Partial<Team>>{
                color: (<HTMLInputElement>e.target).value
            }
        });
    }
</script>

<Col>
    <h3>{teamType} Team</h3>
    <FormGroup>
        <Label for="teamName">Team Name</Label>
        <Input type="text" id="teamName" placeholder="Team Name" value={team.name} on:input={updateTeamName} />
    </FormGroup>
    <FormGroup>
        <Label for="teamColor">Team Color</Label>
        <Input type="color" id="teamColor" value={team.color} on:blur={updateTeamColor} />
    </FormGroup>
</Col>