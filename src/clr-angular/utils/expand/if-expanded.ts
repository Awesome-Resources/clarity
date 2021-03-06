/*
 * Copyright (c) 2016-2017 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import {Directive, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewContainerRef} from "@angular/core";
import {Subscription} from "rxjs/Subscription";

import {Expand} from "./providers/expand";

/**
 * TODO: make this a reusable directive outside of Datagrid, like [clrLoading].
 */
@Directive({selector: "[clrIfExpanded]"})
export class IfExpanded implements OnInit, OnDestroy {
    private _expanded: boolean = false;

    get expanded(): boolean {
        return this._expanded;
    }

    @Input("clrIfExpanded")
    set expanded(value: boolean) {
        if (typeof value === "boolean") {
            this.expand.expanded = value;
            this._expanded = value;
        }
    }

    @Output("clrIfExpandedChange") expandedChange: EventEmitter<boolean> = new EventEmitter<boolean>(true);

    constructor(private template: TemplateRef<any>, private container: ViewContainerRef, private expand: Expand) {
        expand.expandable++;
        this._subscriptions.push(expand.expandChange.subscribe(() => {
            this.updateView();
            this.expandedChange.emit(this.expand.expanded);
        }));
    }

    /**
     * Subscriptions to all the services and queries changes
     */
    private _subscriptions: Subscription[] = [];

    private updateView() {
        if (this.expand.expanded && this.container.length !== 0) {
            return;
        }
        if (this.expand.expanded) {
            // Should we pass a context? I don't see anything useful to pass right now,
            // but we can come back to it in the future as a solution for additional features.
            this.container.createEmbeddedView(this.template);
        } else {
            // TODO: Move when we move the animation logic to Datagrid Row Expand
            // We clear before the animation is over. Not ideal, but doing better would involve a much heavier
            // process for very little gain. Once Angular animations are dynamic enough, we should be able to
            // get the optimal behavior.
            this.container.clear();
        }
    }

    ngOnInit() {
        this.updateView();
    }

    ngOnDestroy() {
        this.expand.expandable--;
        this._subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    }
}
