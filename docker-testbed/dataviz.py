import plotly.io as pio
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

pio.renderers.default = "vscode"

df = pd.read_csv('../../node-red/noderedlogs/compensatelog.txt', delimiter=";", decimal=".")
print(df.head())
df = df.head(190)

fig = make_subplots(specs=[[{"secondary_y": True}]])

# Add traces
fig.add_trace(
    go.Scatter(x = df['timestamp'], y = df['temperature'],mode='lines+markers',
                  name='temperature shift'),
    secondary_y=False,
)

fig.add_trace(
    go.Scatter(x = df['timestamp'], y = df['confidence'],mode='lines+markers',
                  name='confidence shift'),
    secondary_y=True,
)

# Add figure title
fig.update_layout(
    title_text="Compensate Node"
)

# Set x-axis title
fig.update_xaxes(title_text="timestamp")

# Set y-axes titles
fig.update_yaxes(title_text="temperature", secondary_y=False)
fig.update_yaxes(title_text="confidence", secondary_y=True)

fig.show()