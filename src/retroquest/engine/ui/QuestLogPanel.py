from textual.widgets import RichLog, Collapsible, Static
from textual.containers import Container, Vertical
from ..theme import apply_theme

class QuestLogPanel(Vertical):
    def __init__(self):
        super().__init__(id="questlog")
        self.tooltip = "Quest Log"

    def update_questlog(self, active_quests: list, completed_quests: list = None):
        # Remove all existing children
        for child in list(self.children):
            child.remove()
        
        # Add Active Quests header
        active_header = Static(apply_theme("[bold]Active Quests[/bold]"))
        self.mount(active_header)
        
        # Add new Collapsible widgets for each active quest
        if active_quests:
            for quest_name, quest_description in active_quests:
                quest_content = Static(apply_theme(quest_description), classes='quest-description')
                collapsible = Collapsible(quest_content, title=apply_theme(quest_name), classes='quest')
                self.mount(collapsible)
        else:
            no_active = Static(apply_theme("[dim](none)[/dim]"))
            self.mount(no_active)
        
        # Add Completed Quests header and list
        if completed_quests is not None:
            completed_header = Static(apply_theme("[bold]Completed Quests[/bold]"))
            self.mount(completed_header)
            
            if completed_quests:
                for quest_name, quest_completion in completed_quests:
                    quest_content = Static(apply_theme(quest_completion))
                    collapsible = Collapsible(quest_content, title=apply_theme(quest_name), classes='quest completed-quest')
                    self.mount(collapsible)
            else:
                no_completed = Static(apply_theme("[dim](none)[/dim]"))
                self.mount(no_completed)
        pass
