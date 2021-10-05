<script lang="ts">
    import type { HockeyState } from "../../../games/hockey";
    import {
        Col,
        Form,
        FormGroup,
        Input,
        Label,
        Row
    } from 'sveltestrap';
    import Team from "./SetupTeam.svelte";
    import { parseTimeString, timeToString } from "../../../SharedUtilities";
    import type { RecursivePartial } from "../../../SharedUtilities";

    export let state: HockeyState;
    export let partialStateUpdate: (partialState: RecursivePartial<HockeyState>) => void;

    function changePeriodLength(e: FocusEvent) {
        partialStateUpdate({
            config: {
                periodLength: parseTimeString((<HTMLInputElement>e.target).value)
            }
        });
    }

    function changeMinorLength(e: FocusEvent) {
        partialStateUpdate({
            config: {
                minorLength: parseTimeString((<HTMLInputElement>e.target).value)
            }
        });
    }

    function changeMajorLength(e: FocusEvent) {
        partialStateUpdate({
            config: {
                majorLength: parseTimeString((<HTMLInputElement>e.target).value)
            }
        });
    }
</script>

<Row>
    <Col>
        <h3>Clock Setup</h3>
        <FormGroup>
            <Label for="clockSetup">Period Length</Label>
            <Input id="clockSetup" type="text" placeholder="Period Length" on:blur={changePeriodLength} value={timeToString(state.config.periodLength)}/>
        </FormGroup>
        <FormGroup>
            <Label for="minorTime">Minor Length</Label>
            <Input id="minorTime" type="text" placeholder="Period Length" on:blur={changeMinorLength} value={timeToString(state.config.minorLength)}/>
        </FormGroup>
        <FormGroup>
            <Label for="majorLength">Major Length</Label>
            <Input id="majorLength" type="text" placeholder="Period Length" on:blur={changeMajorLength} value={timeToString(state.config.majorLength)}/>
        </FormGroup>
    </Col>
    <Team team={state.home} teamType="Home" {partialStateUpdate} />
    <Team team={state.away} teamType="Away" {partialStateUpdate} />
</Row>