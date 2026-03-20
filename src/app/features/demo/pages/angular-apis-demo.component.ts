import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { AccordionContent, AccordionGroup, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import { Combobox, ComboboxInput, ComboboxPopupContainer } from '@angular/aria/combobox';
import { Grid, GridCell, GridCellWidget, GridRow } from '@angular/aria/grid';
import { Listbox, Option } from '@angular/aria/listbox';
import { Menu, MenuBar, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { Toolbar, ToolbarWidget, ToolbarWidgetGroup } from '@angular/aria/toolbar';
import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';

@Component({
    selector: 'app-angular-apis-demo',
    imports: [
        CommonModule,
        CdkDropList,
        CdkDrag,
        OverlayModule,
        Tabs,
        TabList,
        Tab,
        TabPanel,
        TabContent,
        Toolbar,
        ToolbarWidget,
        ToolbarWidgetGroup,
        Tree,
        TreeItem,
        TreeItemGroup,
        AccordionGroup,
        AccordionTrigger,
        AccordionPanel,
        AccordionContent,
        Combobox,
        ComboboxInput,
        ComboboxPopupContainer,
        Listbox,
        Option,
        Grid,
        GridRow,
        GridCell,
        GridCellWidget,
        MenuBar,
        Menu,
        MenuContent,
        MenuItem,
        MenuTrigger
    ],
    templateUrl: './angular-apis-demo.component.html',
    styleUrl: './angular-apis-demo.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('panelMotion', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ]),
            transition(':leave', [
                animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
            ])
        ])
    ]
})
export class AngularApisDemoComponent {
    readonly localizedTitle = $localize`:@@apisDemoTitle:Angular APIs Showcase`;
    readonly localizedSubtitle =
        $localize`:@@apisDemoSubtitle:Animation, ARIA patterns, CDK drag drop, localization, and service worker basics.`;

    readonly selectedTab = signal<'overview' | 'accessibility' | 'sw'>('overview');
    readonly showAnimatedPanel = signal(true);
    readonly treeExpanded = signal(true);
    readonly searchText = signal('');
    readonly selectedPriorities = signal<string[]>([ 'high' ]);
    readonly selectedTools = signal<string[]>([]);

    readonly backlog = signal([
        $localize`:@@taskOne:Implement ARIA menu`,
        $localize`:@@taskTwo:Add drag and drop`,
        $localize`:@@taskThree:Configure service worker`
    ]);

    readonly activeTabLabel = computed(() => {
        const tab = this.selectedTab();
        if (tab === 'overview') {
            return $localize`:@@tabOverview:Overview`;
        }

        if (tab === 'accessibility') {
            return $localize`:@@tabA11y:Accessibility`;
        }

        return $localize`:@@tabSw:Service Worker`;
    });

    selectTab(tab: 'overview' | 'accessibility' | 'sw'): void {
        this.selectedTab.set(tab);
    }

    toggleAnimatedPanel(): void {
        this.showAnimatedPanel.update((current) => !current);
    }

    toggleTree(): void {
        this.treeExpanded.update((current) => !current);
    }

    pickMenuAction(action: string): void {
        console.log(`Selected demo action: ${action}`);
    }

    onSelectedTabChange(value: string | undefined): void {
        if (!value) {
            return;
        }

        if (value === 'overview' || value === 'accessibility' || value === 'sw') {
            this.selectedTab.set(value);
        }
    }

    onPrioritiesChange(values: string[]): void {
        this.selectedPriorities.set(values);
    }

    onToolbarValuesChange(values: string[]): void {
        this.selectedTools.set(values);
    }

    drop(event: CdkDragDrop<string[]>): void {
        const updated = [ ...this.backlog() ];
        moveItemInArray(updated, event.previousIndex, event.currentIndex);
        this.backlog.set(updated);
    }
}
